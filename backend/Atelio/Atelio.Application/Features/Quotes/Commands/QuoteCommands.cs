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
}

public class CreateQuoteCommand : IRequest<long>
{
    public long CustomerId { get; set; }

    public long VehicleId { get; set; }

    // Garage qui établit le devis (en-tête du document).
    public long GarageId { get; set; }

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
        });
    }
}

public class CreateQuoteCommandHandler : IRequestHandler<CreateQuoteCommand, long>
{
    private readonly IQuoteRepository _quotes;
    private readonly IVehicleRepository _vehicles;
    private readonly IGarageRepository _garages;
    private readonly IArticleRepository _articles;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public CreateQuoteCommandHandler(
        IQuoteRepository quotes,
        IVehicleRepository vehicles,
        IGarageRepository garages,
        IArticleRepository articles,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _quotes = quotes;
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

        var lines = new List<QuoteLine>();
        foreach (var input in request.Lines)
        {
            var article = await _articles.GetByIdAsync(input.ArticleId, cancellationToken);
            if (article is null || !article.IsActive)
            {
                throw new BusinessException("Un article du devis n'existe pas ou n'est plus proposé.");
            }

            lines.Add(new QuoteLine
            {
                ArticleId = article.Id,
                Name = article.Name,
                Description = article.Description,
                UnitPriceHt = article.UnitPriceHt,
                Quantity = input.Quantity,
                Total = Math.Round(input.Quantity * article.UnitPriceHt, 2, MidpointRounding.AwayFromZero),
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
        }, cancellationToken);

        return quote.Id;
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
    private readonly IEmailSender _email;

    public SendQuoteCommandHandler(IQuoteQueryRepository quotes, IEmailSender email)
    {
        _quotes = quotes;
        _email = email;
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

        return Unit.Value;
    }
}
