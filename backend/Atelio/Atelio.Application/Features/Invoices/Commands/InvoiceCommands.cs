using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Invoices.Commands;

// Cycle de fin d'intervention : Terminer les travaux (prête) → Facturer (avec le premier règlement)
// → Encaisser les règlements suivants → clôturée quand tout est payé.

// ============================================================
// TERMINER LES TRAVAUX (véhicule prêt)
// ============================================================

public class FinishInterventionCommand : IRequest<Unit>
{
    public long InterventionId { get; set; }
}

public class FinishInterventionCommandHandler : IRequestHandler<FinishInterventionCommand, Unit>
{
    private readonly IInterventionRepository _interventions;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public FinishInterventionCommandHandler(IInterventionRepository interventions, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _interventions = interventions;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    /// <summary>Travaux terminés : l'intervention est prête (heure de fin), le mécanicien est libéré.</summary>
    public async Task<Unit> Handle(FinishInterventionCommand request, CancellationToken cancellationToken)
    {
        var intervention = await _interventions.GetByIdAsync(request.InterventionId, cancellationToken)
            ?? throw new NotFoundException($"Intervention {request.InterventionId} introuvable.");

        if (intervention.Status != InterventionStatus.InProgress)
        {
            throw new BusinessException("Seule une intervention en cours peut être terminée.");
        }

        var now = _clock.GetUtcNow().UtcDateTime;
        intervention.Status = InterventionStatus.Done;
        intervention.FinishedAt = now;
        intervention.UpdatedAt = now;
        _interventions.Update(intervention);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

// ============================================================
// FACTURER (lignes figées, numéro continu) ET ENCAISSER LE PREMIER RÈGLEMENT
// ============================================================

/// <summary>
/// Émet la facture de l'intervention prête, avec le montant reçu tout de suite (0 : tout reste à payer).
/// Le PDF (version 1) est généré et stocké dans la même opération.
/// </summary>
public class IssueInvoiceCommand : IRequest<long>
{
    public long InterventionId { get; set; }

    // Montant TTC reçu maintenant : de 0 au total.
    public decimal AmountPaid { get; set; }

    // card, cash, transfer, check (obligatoire si un montant est reçu).
    public string? Method { get; set; }
}

public class IssueInvoiceCommandValidator : AbstractValidator<IssueInvoiceCommand>
{
    public IssueInvoiceCommandValidator()
    {
        RuleFor(x => x.AmountPaid).GreaterThanOrEqualTo(0).WithMessage("Le montant reçu ne peut pas être négatif.");
        RuleFor(x => x.Method)
            .Must(PaymentRules.IsValidMethod)
            .WithMessage("Moyen de paiement attendu : carte, espèces, virement ou chèque.")
            .When(x => x.AmountPaid > 0);
    }
}

public class IssueInvoiceCommandHandler : IRequestHandler<IssueInvoiceCommand, long>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly IPaymentRepository _payments;
    private readonly IInvoiceDocumentService _documents;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public IssueInvoiceCommandHandler(
        IInterventionRepository interventions,
        IInvoiceRepository invoices,
        IPaymentRepository payments,
        IInvoiceDocumentService documents,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _interventions = interventions;
        _invoices = invoices;
        _payments = payments;
        _documents = documents;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    /// <summary>Émet la facture : articles copiés, totaux HT / TVA / TTC, premier règlement, PDF v1.</summary>
    public async Task<long> Handle(IssueInvoiceCommand request, CancellationToken cancellationToken)
    {
        var intervention = await _interventions.GetWithLinesAsync(request.InterventionId, cancellationToken)
            ?? throw new NotFoundException($"Intervention {request.InterventionId} introuvable.");

        if (intervention.Status != InterventionStatus.Done)
        {
            throw new BusinessException("Terminez les travaux avant de facturer.");
        }

        if (await _invoices.GetByInterventionAsync(intervention.Id, cancellationToken) is not null)
        {
            throw new BusinessException("Cette intervention est déjà facturée.");
        }

        // Seuls les articles se facturent, en HT ; la TVA s'ajoute au total.
        var lines = intervention.Articles
            .OrderBy(a => a.CreatedAt)
            .ThenBy(a => a.Id)
            .Select((a, i) => new InvoiceLine
            {
                Kind = InvoiceLineKind.Article,
                Label = a.Name,
                Description = a.Description,
                Quantity = a.Quantity,
                UnitPrice = a.UnitPriceHt,
                Total = Math.Round(a.Quantity * a.UnitPriceHt, 2, MidpointRounding.AwayFromZero),
                SortOrder = (short)i,
            })
            .ToList();

        if (lines.Count == 0)
        {
            throw new BusinessException("Rien à facturer : ajoutez des articles.");
        }

        var now = _clock.GetUtcNow().UtcDateTime;
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(now, _tenant.TimeZone));
        var totalHt = lines.Sum(l => l.Total);
        var totalTtc = totalHt + Math.Round(totalHt * InvoiceRules.VatRate, 2, MidpointRounding.AwayFromZero);

        if (request.AmountPaid > totalTtc)
        {
            throw new BusinessException("Le montant reçu dépasse le total de la facture.");
        }

        Invoice invoice = null!;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            invoice = new Invoice
            {
                InterventionId = intervention.Id,
                Number = await _invoices.NextNumberAsync(today.Year, ct),
                IssuedAt = now,
                DueDate = today,
                TotalTtc = totalTtc,
                TotalHt = totalHt,
                TotalVat = totalTtc - totalHt,
                Status = InvoiceStatus.Issued,
                CreatedAt = now,
                UpdatedAt = now,
                Lines = lines,
            };
            await _invoices.AddAsync(invoice, ct);
            intervention.UpdatedAt = now;
            await _unitOfWork.SaveChangesAsync(ct);

            var payments = new List<Payment>();
            if (request.AmountPaid > 0)
            {
                var payment = PaymentRules.NewPayment(invoice.Id, request.AmountPaid, request.Method!, now);
                await _payments.AddAsync(payment, ct);
                payments.Add(payment);
            }

            PaymentRules.ApplyStatus(invoice, intervention, payments.Sum(p => p.Amount), now);

            // PDF v1 : s'il ne peut pas être stocké, rien n'est enregistré (la facture n'est pas émise).
            await _documents.GenerateAsync(invoice, payments, ct);
        }, cancellationToken);

        return invoice.Id;
    }
}

// ============================================================
// ENCAISSER UN RÈGLEMENT (total ou partiel) : nouvelle version du PDF
// ============================================================

public class PayInvoiceCommand : IRequest<Unit>
{
    public long InvoiceId { get; set; }

    // card, cash, transfer, check
    public string Method { get; set; } = null!;

    // Montant TTC reçu, au plus le reste à payer.
    public decimal Amount { get; set; }
}

public class PayInvoiceCommandValidator : AbstractValidator<PayInvoiceCommand>
{
    public PayInvoiceCommandValidator()
    {
        RuleFor(x => x.Method)
            .Must(PaymentRules.IsValidMethod)
            .WithMessage("Moyen de paiement attendu : carte, espèces, virement ou chèque.");
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Le montant reçu doit être supérieur à 0.");
    }
}

public class PayInvoiceCommandHandler : IRequestHandler<PayInvoiceCommand, Unit>
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPaymentRepository _payments;
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceDocumentService _documents;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public PayInvoiceCommandHandler(
        IInvoiceRepository invoices,
        IPaymentRepository payments,
        IInterventionRepository interventions,
        IInvoiceDocumentService documents,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _invoices = invoices;
        _payments = payments;
        _interventions = interventions;
        _documents = documents;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    /// <summary>
    /// Encaisse un règlement : la facture est payée quand le reste à payer tombe à 0 (l'intervention est alors clôturée),
    /// sinon partiellement payée. Une nouvelle version du PDF est générée avec les règlements à jour.
    /// </summary>
    public async Task<Unit> Handle(PayInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetWithLinesAsync(request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException($"Facture {request.InvoiceId} introuvable.");

        if (invoice.Status is not (InvoiceStatus.Issued or InvoiceStatus.PartiallyPaid))
        {
            throw new BusinessException("Cette facture est déjà réglée ou annulée.");
        }

        var payments = await _payments.GetSucceededAsync(invoice.Id, cancellationToken);
        var remaining = invoice.TotalTtc - payments.Sum(p => p.Amount);
        if (request.Amount > remaining)
        {
            throw new BusinessException($"Le montant dépasse le reste à payer ({remaining:0.00} €).");
        }

        var intervention = await _interventions.GetByIdAsync(invoice.InterventionId, cancellationToken)
            ?? throw new NotFoundException($"Intervention {invoice.InterventionId} introuvable.");

        var now = _clock.GetUtcNow().UtcDateTime;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var payment = PaymentRules.NewPayment(invoice.Id, request.Amount, request.Method, now);
            await _payments.AddAsync(payment, ct);
            payments.Add(payment);

            PaymentRules.ApplyStatus(invoice, intervention, payments.Sum(p => p.Amount), now);
            await _documents.GenerateAsync(invoice, payments, ct);
        }, cancellationToken);

        return Unit.Value;
    }
}

// ============================================================
// RÉGÉNÉRER LE PDF (facture émise avant les PDF, ou échec de stockage)
// ============================================================

public class GenerateInvoiceDocumentCommand : IRequest<Unit>
{
    public long InvoiceId { get; set; }
}

public class GenerateInvoiceDocumentCommandHandler : IRequestHandler<GenerateInvoiceDocumentCommand, Unit>
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPaymentRepository _payments;
    private readonly IInvoiceDocumentService _documents;
    private readonly IUnitOfWork _unitOfWork;

    public GenerateInvoiceDocumentCommandHandler(
        IInvoiceRepository invoices, IPaymentRepository payments, IInvoiceDocumentService documents, IUnitOfWork unitOfWork)
    {
        _invoices = invoices;
        _payments = payments;
        _documents = documents;
        _unitOfWork = unitOfWork;
    }

    /// <summary>Génère une nouvelle version du PDF avec l'état actuel (règlements compris).</summary>
    public async Task<Unit> Handle(GenerateInvoiceDocumentCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetWithLinesAsync(request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException($"Facture {request.InvoiceId} introuvable.");
        var payments = await _payments.GetSucceededAsync(invoice.Id, cancellationToken);

        await _documents.GenerateAsync(invoice, payments, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class PaymentRules
{
    public static bool IsValidMethod(string? method) => method is "card" or "cash" or "transfer" or "check";

    public static Payment NewPayment(long invoiceId, decimal amount, string method, DateTime nowUtc) => new()
    {
        InvoiceId = invoiceId,
        Amount = amount,
        Method = Enum.Parse<PaymentMethod>(method, ignoreCase: true),
        Status = PaymentStatus.Succeeded,
        PaidAt = nowUtc,
        CreatedAt = nowUtc,
    };

    /// <summary>
    /// Statut selon le total réglé : rien → émise (intervention facturée), une partie → partiellement payée,
    /// tout → payée et intervention clôturée.
    /// </summary>
    public static void ApplyStatus(Invoice invoice, Intervention intervention, decimal paid, DateTime nowUtc)
    {
        invoice.Status = paid <= 0 ? InvoiceStatus.Issued
            : paid < invoice.TotalTtc ? InvoiceStatus.PartiallyPaid
            : InvoiceStatus.Paid;
        invoice.UpdatedAt = nowUtc;

        intervention.Status = invoice.Status == InvoiceStatus.Paid ? InterventionStatus.Closed : InterventionStatus.Invoiced;
        intervention.UpdatedAt = nowUtc;
    }
}

public static class InvoiceRules
{
    /// <summary>TVA de la réparation automobile (taux normal).</summary>
    public const decimal VatRate = 0.20m;

    /// <summary>Une intervention facturée ne se modifie plus (main-d'œuvre, pièces).</summary>
    public static async Task EnsureNotInvoicedAsync(IInvoiceRepository invoices, long interventionId, CancellationToken cancellationToken)
    {
        if (await invoices.GetByInterventionAsync(interventionId, cancellationToken) is not null)
        {
            throw new BusinessException("Cette intervention est facturée : elle ne peut plus être modifiée.");
        }
    }
}
