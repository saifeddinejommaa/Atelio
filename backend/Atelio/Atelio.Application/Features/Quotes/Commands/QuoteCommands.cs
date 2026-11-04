using Atelio.Application.Common;
using Atelio.Application.Features.Invoices.Commands;
using Atelio.Application.Features.Quotes.Repositories;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;
using System.Globalization;
using System.Text;

namespace Atelio.Application.Features.Quotes.Commands;

// ============================================================
// CRÉER UN DEVIS (articles du catalogue, prix HT copiés)
// ============================================================

public class QuoteLineInput
{
    public long ArticleId { get; set; }

    // Décimale possible (ex. 4,5 L).
    public decimal Quantity { get; set; }

    // Prix HT propre à ce devis (le catalogue ne change pas). Absent : prix du catalogue, ou celui déjà au devis.
    public decimal? UnitPriceHt { get; set; }
}

public class CreateQuoteCommand : IRequest<long>
{
    public long CustomerId { get; set; }

    public long VehicleId { get; set; }

    // Garage qui établit le devis (en-tête du document).
    public long GarageId { get; set; }

    // Demande du client traitée par ce devis, s'il y en a une.
    public long? QuoteRequestId { get; set; }

    public List<QuoteLineInput> Lines { get; set; } = [];
}

public class CreateQuoteCommandValidator : AbstractValidator<CreateQuoteCommand>
{
    public CreateQuoteCommandValidator()
    {
        RuleFor(x => x.CustomerId).GreaterThan(0);
        RuleFor(x => x.VehicleId).GreaterThan(0).WithMessage("Choisissez le véhicule.");
        RuleFor(x => x.GarageId).GreaterThan(0);
        RuleFor(x => x.Lines).NotEmpty().WithMessage("Ajoutez au moins un article.");
        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.ArticleId).GreaterThan(0);
            line.RuleFor(l => l.Quantity).GreaterThan(0).WithMessage("La quantité doit être supérieure à 0.");
            line.RuleFor(l => l.UnitPriceHt).GreaterThanOrEqualTo(0).WithMessage("Le prix ne peut pas être négatif.");
        });
    }
}

public class CreateQuoteCommandHandler : IRequestHandler<CreateQuoteCommand, long>
{
    private readonly IQuoteRepository _quotes;
    private readonly IQuoteRequestRepository _requests;
    private readonly IVehicleRepository _vehicles;
    private readonly IGarageRepository _garages;
    private readonly IArticleRepository _articles;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public CreateQuoteCommandHandler(
        IQuoteRepository quotes,
        IQuoteRequestRepository requests,
        IVehicleRepository vehicles,
        IGarageRepository garages,
        IArticleRepository articles,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _quotes = quotes;
        _requests = requests;
        _vehicles = vehicles;
        _garages = garages;
        _articles = articles;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<long> Handle(CreateQuoteCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicles.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle is null || vehicle.CustomerId != request.CustomerId)
        {
            throw new BusinessException("Ce véhicule n'appartient pas à ce client.");
        }

        _ = await _garages.GetByIdAsync(request.GarageId, cancellationToken)
            ?? throw new NotFoundException($"Garage {request.GarageId} introuvable.");

        QuoteRequest? quoteRequest = null;
        if (request.QuoteRequestId is long quoteRequestId)
        {
            quoteRequest = await _requests.GetByIdAsync(quoteRequestId, cancellationToken);
            if (quoteRequest is null || quoteRequest.CustomerId != request.CustomerId)
            {
                throw new NotFoundException($"Demande de devis {quoteRequestId} introuvable.");
            }

            if (quoteRequest.QuoteId is not null)
            {
                throw new BusinessException("Cette demande de devis a déjà été traitée.");
            }
        }

        var lines = new List<QuoteLine>();
        foreach (var input in request.Lines)
        {
            var article = await _articles.GetByIdAsync(input.ArticleId, cancellationToken);
            if (article is null || !article.IsActive)
            {
                throw new BusinessException("Un article du devis n'existe pas ou n'est plus proposé.");
            }

            var unitPriceHt = Math.Round(input.UnitPriceHt ?? article.UnitPriceHt, 2, MidpointRounding.AwayFromZero);
            lines.Add(new QuoteLine
            {
                ArticleId = article.Id,
                Name = article.Name,
                Description = article.Description,
                UnitPriceHt = unitPriceHt,
                Quantity = input.Quantity,
                Total = Math.Round(input.Quantity * unitPriceHt, 2, MidpointRounding.AwayFromZero),
                SortOrder = (short)lines.Count,
            });
        }

        // Même calcul que la facture : HT = somme des lignes, puis TVA.
        var totalHt = lines.Sum(l => l.Total);
        var totalVat = Math.Round(totalHt * InvoiceRules.VatRate, 2, MidpointRounding.AwayFromZero);
        var now = _clock.GetUtcNow().UtcDateTime;
        var year = TimeZoneInfo.ConvertTimeFromUtc(now, _tenant.TimeZone).Year;

        Quote quote = null!;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            quote = new Quote
            {
                Number = await _quotes.NextNumberAsync(year, ct),
                CustomerId = request.CustomerId,
                VehicleId = vehicle.Id,
                GarageId = request.GarageId,
                TotalHt = totalHt,
                TotalVat = totalVat,
                TotalTtc = totalHt + totalVat,
                CreatedAt = now,
                Lines = lines,
            };
            await _quotes.AddAsync(quote, ct);

            if (quoteRequest is not null)
            {
                await _unitOfWork.SaveChangesAsync(ct);
                quoteRequest.QuoteId = quote.Id;
            }
        }, cancellationToken);

        return quote.Id;
    }
}

// ============================================================
// MODIFIER UN DEVIS (tant qu'il n'est ni envoyé ni importé)
// ============================================================

public class UpdateQuoteCommand : IRequest<Unit>
{
    public long QuoteId { get; set; }

    public long VehicleId { get; set; }

    public List<QuoteLineInput> Lines { get; set; } = [];
}

public class UpdateQuoteCommandValidator : AbstractValidator<UpdateQuoteCommand>
{
    public UpdateQuoteCommandValidator()
    {
        RuleFor(x => x.VehicleId).GreaterThan(0).WithMessage("Choisissez le véhicule.");
        RuleFor(x => x.Lines).NotEmpty().WithMessage("Ajoutez au moins un article.");
        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.ArticleId).GreaterThan(0);
            line.RuleFor(l => l.Quantity).GreaterThan(0).WithMessage("La quantité doit être supérieure à 0.");
            line.RuleFor(l => l.UnitPriceHt).GreaterThanOrEqualTo(0).WithMessage("Le prix ne peut pas être négatif.");
        });
    }
}

public class UpdateQuoteCommandHandler : IRequestHandler<UpdateQuoteCommand, Unit>
{
    private readonly IQuoteRepository _quotes;
    private readonly IVehicleRepository _vehicles;
    private readonly IArticleRepository _articles;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateQuoteCommandHandler(
        IQuoteRepository quotes,
        IVehicleRepository vehicles,
        IArticleRepository articles,
        IUnitOfWork unitOfWork)
    {
        _quotes = quotes;
        _vehicles = vehicles;
        _articles = articles;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(UpdateQuoteCommand request, CancellationToken cancellationToken)
    {
        var quote = await _quotes.GetForUpdateAsync(request.QuoteId, cancellationToken)
            ?? throw new NotFoundException($"Devis {request.QuoteId} introuvable.");

        if (quote.SentAt is not null)
        {
            throw new BusinessException("Ce devis a déjà été envoyé au client : il ne peut plus être modifié.");
        }

        if (await _quotes.IsImportedAsync(quote.Id, cancellationToken))
        {
            throw new BusinessException("Ce devis a été importé sur une intervention : il ne peut plus être modifié.");
        }

        var vehicle = await _vehicles.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle is null || vehicle.CustomerId != quote.CustomerId)
        {
            throw new BusinessException("Ce véhicule n'appartient pas à ce client.");
        }

        // Sans prix saisi, une ligne déjà au devis garde le sien et un article ajouté prend celui du catalogue.
        var existing = quote.Lines.OrderBy(l => l.SortOrder).ThenBy(l => l.Id).ToList();
        var lines = new List<QuoteLine>();
        foreach (var input in request.Lines)
        {
            var known = existing.FirstOrDefault(l => l.ArticleId == input.ArticleId);
            string name;
            string? description;
            decimal unitPriceHt;
            if (known is not null)
            {
                existing.Remove(known);
                (name, description, unitPriceHt) = (known.Name, known.Description, known.UnitPriceHt);
            }
            else
            {
                var article = await _articles.GetByIdAsync(input.ArticleId, cancellationToken);
                if (article is null || !article.IsActive)
                {
                    throw new BusinessException("Un article du devis n'existe pas ou n'est plus proposé.");
                }

                (name, description, unitPriceHt) = (article.Name, article.Description, article.UnitPriceHt);
            }

            unitPriceHt = Math.Round(input.UnitPriceHt ?? unitPriceHt, 2, MidpointRounding.AwayFromZero);
            lines.Add(new QuoteLine
            {
                ArticleId = input.ArticleId,
                Name = name,
                Description = description,
                UnitPriceHt = unitPriceHt,
                Quantity = input.Quantity,
                Total = Math.Round(input.Quantity * unitPriceHt, 2, MidpointRounding.AwayFromZero),
                SortOrder = (short)lines.Count,
            });
        }

        // Même calcul que la création.
        var totalHt = lines.Sum(l => l.Total);
        var totalVat = Math.Round(totalHt * InvoiceRules.VatRate, 2, MidpointRounding.AwayFromZero);

        quote.VehicleId = vehicle.Id;
        quote.TotalHt = totalHt;
        quote.TotalVat = totalVat;
        quote.TotalTtc = totalHt + totalVat;
        quote.Lines.Clear();
        quote.Lines.AddRange(lines);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

// ============================================================
// ENVOYER LE DEVIS PAR E-MAIL AU CLIENT
// ============================================================

public class SendQuoteCommand : IRequest<Unit>
{
    public long QuoteId { get; set; }
}

public class SendQuoteCommandHandler : IRequestHandler<SendQuoteCommand, Unit>
{
    private static readonly CultureInfo French = CultureInfo.GetCultureInfo("fr-FR");

    private readonly IQuoteQueryRepository _quotes;
    private readonly IQuoteRepository _writeQuotes;
    private readonly IEmailSender _email;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public SendQuoteCommandHandler(
        IQuoteQueryRepository quotes,
        IQuoteRepository writeQuotes,
        IEmailSender email,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _quotes = quotes;
        _writeQuotes = writeQuotes;
        _email = email;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(SendQuoteCommand request, CancellationToken cancellationToken)
    {
        var quote = await _quotes.GetByIdAsync(request.QuoteId, cancellationToken)
            ?? throw new NotFoundException($"Devis {request.QuoteId} introuvable.");

        if (string.IsNullOrWhiteSpace(quote.CustomerEmail))
        {
            throw new BusinessException("Ce client n'a pas d'adresse e-mail : complétez sa fiche ou imprimez le devis.");
        }

        string Euro(decimal amount) => amount.ToString("C", French);

        var vehicle = string.Join(' ', new[] { quote.VehicleMake, quote.VehicleModel, quote.VehicleVersion }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var body = new StringBuilder()
            .AppendLine($"Bonjour {quote.CustomerFirstName} {quote.CustomerLastName},")
            .AppendLine()
            .AppendLine($"Voici le devis {quote.Number} établi par votre garage {quote.GarageName}")
            .AppendLine($"pour votre véhicule {quote.VehiclePlate}{(vehicle.Length > 0 ? $" ({vehicle})" : string.Empty)}.")
            .AppendLine();

        foreach (var line in quote.Lines)
        {
            body.AppendLine($"- {line.Name} : {line.Quantity.ToString("0.##", French)} x {Euro(line.UnitPriceHt)} HT = {Euro(line.Total)} HT");
            if (!string.IsNullOrWhiteSpace(line.Description))
            {
                foreach (var operation in line.Description.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    body.AppendLine($"    {operation}");
                }
            }
        }

        body.AppendLine()
            .AppendLine($"Total HT : {Euro(quote.TotalHt)}")
            .AppendLine($"TVA {InvoiceRules.VatRate * 100:0} % : {Euro(quote.TotalVat)}")
            .AppendLine($"Total TTC : {Euro(quote.TotalTtc)}")
            .AppendLine()
            .AppendLine($"Pour toute question : {quote.GarageName}, {quote.GarageAddress}{(quote.GaragePhone is null ? string.Empty : $", {quote.GaragePhone}")}.");

        await _email.SendAsync(quote.CustomerEmail, $"Votre devis {quote.Number}", body.ToString(), cancellationToken);

        // Le client l'a reçu : le devis n'est plus modifiable. Un renvoi garde la date du premier envoi.
        var sent = await _writeQuotes.GetByIdAsync(request.QuoteId, cancellationToken);
        if (sent is { SentAt: null })
        {
            sent.SentAt = _clock.GetUtcNow().UtcDateTime;
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Unit.Value;
    }
}
