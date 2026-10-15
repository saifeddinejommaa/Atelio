using Atelio.Application.Common;
using Atelio.Application.Features.Invoices.Commands;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Interventions.Commands;

// ============================================================
// ASSIGN EMPLOYEE (mécanicien chargé de l'intervention)
// ============================================================

public class AssignInterventionEmployeeCommand : IRequest<Unit>
{
    public long InterventionId { get; set; }

    public long EmployeeId { get; set; }
}

public class AssignInterventionEmployeeCommandHandler : IRequestHandler<AssignInterventionEmployeeCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IEmployeeRepository _employees;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public AssignInterventionEmployeeCommandHandler(
        IInterventionRepository interventions,
        IEmployeeRepository employees,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _interventions = interventions;
        _employees = employees;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(AssignInterventionEmployeeCommand request, CancellationToken cancellationToken)
    {
        var intervention = await _interventions.GetByIdAsync(request.InterventionId, cancellationToken)
            ?? throw new NotFoundException($"Intervention {request.InterventionId} introuvable.");

        if (intervention.Status is not (InterventionStatus.Planned or InterventionStatus.InProgress))
        {
            throw new BusinessException("Cette intervention est close : son mécanicien ne peut plus être changé.");
        }

        var employee = await _employees.GetByIdAsync(request.EmployeeId, cancellationToken);
        if (employee is null || !employee.IsActive || employee.Role != EmployeeRole.Mechanic || employee.GarageId != intervention.GarageId)
        {
            throw new BusinessException("Choisissez un mécanicien actif de ce garage.");
        }

        intervention.EmployeeId = employee.Id;
        intervention.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        _interventions.Update(intervention);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

// ============================================================
// PIÈCES ET FOURNITURES (saisies par l'accueil, prix TTC)
// ============================================================

public class SparePartInput
{
    // Référence fabricant, facultative.
    public string? Reference { get; set; }

    public string Name { get; set; } = null!;

    // Décimale possible (ex. 4,5 L d'huile).
    public decimal Quantity { get; set; }

    // Prix unitaire TTC.
    public decimal UnitPrice { get; set; }
}

public class SparePartInputValidator : AbstractValidator<SparePartInput>
{
    public SparePartInputValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Indiquez la désignation de la pièce.").MaximumLength(200);
        RuleFor(x => x.Reference).MaximumLength(100);
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("La quantité doit être supérieure à 0.");
        RuleFor(x => x.UnitPrice).GreaterThanOrEqualTo(0).WithMessage("Le prix ne peut pas être négatif.");
    }
}

public class AddSparePartCommand : SparePartInput, IRequest<long>
{
    public long InterventionId { get; set; }
}

public class AddSparePartCommandValidator : AbstractValidator<AddSparePartCommand>
{
    public AddSparePartCommandValidator()
    {
        Include(new SparePartInputValidator());
    }
}

public class AddSparePartCommandHandler : IRequestHandler<AddSparePartCommand, long>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly ISparePartRepository _parts;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public AddSparePartCommandHandler(
        IInterventionRepository interventions,
        IInvoiceRepository invoices, ISparePartRepository parts, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _interventions = interventions;
        _invoices = invoices;
        _parts = parts;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<long> Handle(AddSparePartCommand request, CancellationToken cancellationToken)
    {
        await SparePartRules.EnsureEditableAsync(_interventions, _invoices, request.InterventionId, cancellationToken);

        var part = new SparePart
        {
            InterventionId = request.InterventionId,
            Reference = TextRules.Clean(request.Reference),
            Name = request.Name.Trim(),
            Quantity = request.Quantity,
            UnitPrice = request.UnitPrice,
            CreatedAt = _clock.GetUtcNow().UtcDateTime,
        };

        await _parts.AddAsync(part, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return part.Id;
    }
}

public class UpdateSparePartCommand : SparePartInput, IRequest<Unit>
{
    public long InterventionId { get; set; }

    public long SparePartId { get; set; }
}

public class UpdateSparePartCommandValidator : AbstractValidator<UpdateSparePartCommand>
{
    public UpdateSparePartCommandValidator()
    {
        Include(new SparePartInputValidator());
    }
}

public class UpdateSparePartCommandHandler : IRequestHandler<UpdateSparePartCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly ISparePartRepository _parts;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateSparePartCommandHandler(IInterventionRepository interventions, IInvoiceRepository invoices, ISparePartRepository parts, IUnitOfWork unitOfWork)
    {
        _interventions = interventions;
        _invoices = invoices;
        _parts = parts;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(UpdateSparePartCommand request, CancellationToken cancellationToken)
    {
        await SparePartRules.EnsureEditableAsync(_interventions, _invoices, request.InterventionId, cancellationToken);
        var part = await SparePartRules.GetAsync(_parts, request.InterventionId, request.SparePartId, cancellationToken);

        part.Reference = TextRules.Clean(request.Reference);
        part.Name = request.Name.Trim();
        part.Quantity = request.Quantity;
        part.UnitPrice = request.UnitPrice;
        _parts.Update(part);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

public class DeleteSparePartCommand : IRequest<Unit>
{
    public long InterventionId { get; set; }

    public long SparePartId { get; set; }
}

public class DeleteSparePartCommandHandler : IRequestHandler<DeleteSparePartCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly ISparePartRepository _parts;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteSparePartCommandHandler(IInterventionRepository interventions, IInvoiceRepository invoices, ISparePartRepository parts, IUnitOfWork unitOfWork)
    {
        _interventions = interventions;
        _invoices = invoices;
        _parts = parts;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeleteSparePartCommand request, CancellationToken cancellationToken)
    {
        await SparePartRules.EnsureEditableAsync(_interventions, _invoices, request.InterventionId, cancellationToken);
        var part = await SparePartRules.GetAsync(_parts, request.InterventionId, request.SparePartId, cancellationToken);

        _parts.Remove(part);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class SparePartRules
{
    /// <summary>L'intervention doit exister et ne pas être facturée.</summary>
    public static async Task EnsureEditableAsync(
        IInterventionRepository interventions, IInvoiceRepository invoices, long interventionId, CancellationToken cancellationToken)
    {
        _ = await interventions.GetByIdAsync(interventionId, cancellationToken)
            ?? throw new NotFoundException($"Intervention {interventionId} introuvable.");
        await InvoiceRules.EnsureNotInvoicedAsync(invoices, interventionId, cancellationToken);
    }

    public static async Task<SparePart> GetAsync(ISparePartRepository parts, long interventionId, long sparePartId, CancellationToken cancellationToken)
    {
        var part = await parts.GetByIdAsync(sparePartId, cancellationToken);
        return part is not null && part.InterventionId == interventionId
            ? part
            : throw new NotFoundException($"Pièce {sparePartId} introuvable.");
    }
}

// ============================================================
// ARTICLES (importés du catalogue : nom, description et prix HT copiés ; quantité et promotion se saisissent)
// ============================================================

public class AddInterventionArticleCommand : IRequest<long>
{
    public long InterventionId { get; set; }

    public long ArticleId { get; set; }

    // Décimale possible (ex. 4,5 L).
    public decimal Quantity { get; set; }

    // Promotion en cours appliquée à la ligne, sinon null.
    public long? PromotionId { get; set; }
}

public class AddInterventionArticleCommandValidator : AbstractValidator<AddInterventionArticleCommand>
{
    public AddInterventionArticleCommandValidator()
    {
        RuleFor(x => x.ArticleId).GreaterThan(0).WithMessage("Choisissez un article.");
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("La quantité doit être supérieure à 0.");
    }
}

public class AddInterventionArticleCommandHandler : IRequestHandler<AddInterventionArticleCommand, long>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly IArticleRepository _articles;
    private readonly IInterventionArticleRepository _lines;
    private readonly IPromotionRepository _promotions;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public AddInterventionArticleCommandHandler(
        IInterventionRepository interventions,
        IInvoiceRepository invoices,
        IArticleRepository articles,
        IInterventionArticleRepository lines,
        IPromotionRepository promotions,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _interventions = interventions;
        _invoices = invoices;
        _articles = articles;
        _lines = lines;
        _promotions = promotions;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<long> Handle(AddInterventionArticleCommand request, CancellationToken cancellationToken)
    {
        await SparePartRules.EnsureEditableAsync(_interventions, _invoices, request.InterventionId, cancellationToken);

        var article = await _articles.GetByIdAsync(request.ArticleId, cancellationToken);
        if (article is null || !article.IsActive)
        {
            throw new BusinessException("Cet article n'existe pas ou n'est plus proposé.");
        }

        var line = new InterventionArticle
        {
            InterventionId = request.InterventionId,
            ArticleId = article.Id,
            Name = article.Name,
            Description = article.Description,
            UnitPriceHt = article.UnitPriceHt,
            Quantity = request.Quantity,
            CreatedAt = _clock.GetUtcNow().UtcDateTime,
        };
        await InterventionArticleRules.SetPromotionAsync(line, request.PromotionId, _promotions, _tenant, _clock, cancellationToken);

        await _lines.AddAsync(line, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return line.Id;
    }
}

public class UpdateInterventionArticleCommand : IRequest<Unit>
{
    public long InterventionId { get; set; }

    public long LineId { get; set; }

    public decimal Quantity { get; set; }

    // Promotion de la ligne (null : aucune). Inchangée, elle garde sa remise d'origine même si elle est terminée.
    public long? PromotionId { get; set; }
}

public class UpdateInterventionArticleCommandValidator : AbstractValidator<UpdateInterventionArticleCommand>
{
    public UpdateInterventionArticleCommandValidator()
    {
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("La quantité doit être supérieure à 0.");
    }
}

public class UpdateInterventionArticleCommandHandler : IRequestHandler<UpdateInterventionArticleCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly IInterventionArticleRepository _lines;
    private readonly IPromotionRepository _promotions;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public UpdateInterventionArticleCommandHandler(
        IInterventionRepository interventions,
        IInvoiceRepository invoices,
        IInterventionArticleRepository lines,
        IPromotionRepository promotions,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _interventions = interventions;
        _invoices = invoices;
        _lines = lines;
        _promotions = promotions;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<Unit> Handle(UpdateInterventionArticleCommand request, CancellationToken cancellationToken)
    {
        await SparePartRules.EnsureEditableAsync(_interventions, _invoices, request.InterventionId, cancellationToken);
        var line = await InterventionArticleRules.GetAsync(_lines, request.InterventionId, request.LineId, cancellationToken);

        line.Quantity = request.Quantity;
        if (request.PromotionId != line.PromotionId)
        {
            await InterventionArticleRules.SetPromotionAsync(line, request.PromotionId, _promotions, _tenant, _clock, cancellationToken);
        }

        _lines.Update(line);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

public class DeleteInterventionArticleCommand : IRequest<Unit>
{
    public long InterventionId { get; set; }

    public long LineId { get; set; }
}

public class DeleteInterventionArticleCommandHandler : IRequestHandler<DeleteInterventionArticleCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly IInterventionArticleRepository _lines;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteInterventionArticleCommandHandler(
        IInterventionRepository interventions, IInvoiceRepository invoices, IInterventionArticleRepository lines, IUnitOfWork unitOfWork)
    {
        _interventions = interventions;
        _invoices = invoices;
        _lines = lines;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeleteInterventionArticleCommand request, CancellationToken cancellationToken)
    {
        await SparePartRules.EnsureEditableAsync(_interventions, _invoices, request.InterventionId, cancellationToken);
        var line = await InterventionArticleRules.GetAsync(_lines, request.InterventionId, request.LineId, cancellationToken);

        _lines.Remove(line);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

/// <summary>
/// Importe un devis du client de l'intervention : ses lignes s'ajoutent aux articles, telles qu'au devis
/// (nom, description, prix HT, quantité). Un devis ne s'importe qu'une fois.
/// </summary>
public class ImportQuoteCommand : IRequest<Unit>
{
    public long InterventionId { get; set; }

    public long QuoteId { get; set; }
}

public class ImportQuoteCommandHandler : IRequestHandler<ImportQuoteCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly IQuoteRepository _quotes;
    private readonly IInterventionArticleRepository _lines;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public ImportQuoteCommandHandler(
        IInterventionRepository interventions,
        IInvoiceRepository invoices,
        IQuoteRepository quotes,
        IInterventionArticleRepository lines,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _interventions = interventions;
        _invoices = invoices;
        _quotes = quotes;
        _lines = lines;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(ImportQuoteCommand request, CancellationToken cancellationToken)
    {
        var intervention = await _interventions.GetByIdAsync(request.InterventionId, cancellationToken)
            ?? throw new NotFoundException($"Intervention {request.InterventionId} introuvable.");
        await InvoiceRules.EnsureNotInvoicedAsync(_invoices, intervention.Id, cancellationToken);

        var quote = await _quotes.GetWithLinesAsync(request.QuoteId, cancellationToken)
            ?? throw new NotFoundException($"Devis {request.QuoteId} introuvable.");
        if (quote.CustomerId != intervention.CustomerId)
        {
            throw new BusinessException("Ce devis a été établi pour un autre client.");
        }

        if (await _lines.HasQuoteAsync(intervention.Id, quote.Id, cancellationToken))
        {
            throw new BusinessException($"Le devis {quote.Number} est déjà importé sur cette intervention.");
        }

        var now = _clock.GetUtcNow().UtcDateTime;
        foreach (var line in quote.Lines.OrderBy(l => l.SortOrder).ThenBy(l => l.Id))
        {
            await _lines.AddAsync(new InterventionArticle
            {
                InterventionId = intervention.Id,
                ArticleId = line.ArticleId,
                QuoteId = quote.Id,
                Name = line.Name,
                Description = line.Description,
                UnitPriceHt = line.UnitPriceHt,
                Quantity = line.Quantity,
                CreatedAt = now,
            }, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class InterventionArticleRules
{
    public static async Task<InterventionArticle> GetAsync(
        IInterventionArticleRepository lines, long interventionId, long lineId, CancellationToken cancellationToken)
    {
        var line = await lines.GetByIdAsync(lineId, cancellationToken);
        return line is not null && line.InterventionId == interventionId
            ? line
            : throw new NotFoundException($"Article {lineId} introuvable sur l'intervention {interventionId}.");
    }

    /// <summary>
    /// Applique la promotion choisie à la ligne (sa remise est figée) ; elle doit être active et en cours aujourd'hui.
    /// Null retire la promotion.
    /// </summary>
    public static async Task SetPromotionAsync(
        InterventionArticle line,
        long? promotionId,
        IPromotionRepository promotions,
        ITenantContext tenant,
        TimeProvider clock,
        CancellationToken cancellationToken)
    {
        if (promotionId is not long id)
        {
            line.PromotionId = null;
            line.DiscountPercent = null;
            return;
        }

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(clock.GetUtcNow().UtcDateTime, tenant.TimeZone));
        var promotion = await promotions.GetByIdAsync(id, cancellationToken);
        if (promotion is null || !promotion.IsActive || promotion.StartsOn > today || promotion.EndsOn < today)
        {
            throw new BusinessException("Cette promotion n'est pas en cours.");
        }

        line.PromotionId = promotion.Id;
        line.DiscountPercent = promotion.DiscountPercent;
    }
}

// ============================================================
// MAIN-D'ŒUVRE D'UNE PRESTATION (ex. « Autre » : temps passé et type indiqués par le mécanicien)
// ============================================================

public class UpdateServiceLabourCommand : IRequest<Unit>
{
    public long InterventionId { get; set; }

    public long ServiceId { get; set; }

    // Temps passé, en minutes.
    public int LabourMinutes { get; set; }

    // Catégorie : donne le taux horaire.
    public long CategoryId { get; set; }
}

public class UpdateServiceLabourCommandValidator : AbstractValidator<UpdateServiceLabourCommand>
{
    public UpdateServiceLabourCommandValidator()
    {
        RuleFor(x => x.LabourMinutes).GreaterThan(0).WithMessage("Indiquez le temps passé.");
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Choisissez le type de prestation.");
    }
}

public class UpdateServiceLabourCommandHandler : IRequestHandler<UpdateServiceLabourCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly IServiceCategoryRepository _categories;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateServiceLabourCommandHandler(
        IInterventionRepository interventions,
        IInvoiceRepository invoices, IServiceCategoryRepository categories, IUnitOfWork unitOfWork)
    {
        _interventions = interventions;
        _invoices = invoices;
        _categories = categories;
        _unitOfWork = unitOfWork;
    }

    /// <summary>Met à jour le temps et la catégorie de la prestation ; son prix = taux de la catégorie × temps.</summary>
    public async Task<Unit> Handle(UpdateServiceLabourCommand request, CancellationToken cancellationToken)
    {
        var line = await _interventions.GetServiceLineAsync(request.InterventionId, request.ServiceId, cancellationToken)
            ?? throw new NotFoundException($"Prestation {request.ServiceId} introuvable dans l'intervention {request.InterventionId}.");
        await InvoiceRules.EnsureNotInvoicedAsync(_invoices, request.InterventionId, cancellationToken);

        var category = await _categories.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new BusinessException("Type de prestation inconnu.");

        line.LabourMinutes = request.LabourMinutes;
        line.CategoryId = category.Id;
        line.UnitPrice = Pricing.Labour(category.HourlyRate, request.LabourMinutes);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
