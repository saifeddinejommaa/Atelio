using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Invoices.Commands;

// Cycle de fin d'intervention : Terminer les travaux (prête) → Facturer → Encaisser (clôturée).

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
// FACTURER (lignes figées, numéro continu)
// ============================================================

public class IssueInvoiceCommand : IRequest<long>
{
    public long InterventionId { get; set; }
}

public class IssueInvoiceCommandHandler : IRequestHandler<IssueInvoiceCommand, long>
{
    private readonly IInterventionRepository _interventions;
    private readonly IInvoiceRepository _invoices;
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public IssueInvoiceCommandHandler(
        IInterventionRepository interventions,
        IInvoiceRepository invoices,
        IServiceRepository services,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _interventions = interventions;
        _invoices = invoices;
        _services = services;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    /// <summary>Émet la facture de l'intervention prête : main-d'œuvre et pièces copiées, totaux HT / TVA / TTC.</summary>
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

        var names = (await _services.GetByIdsAsync(intervention.Services.Select(s => s.ServiceId).ToList(), cancellationToken))
            .ToDictionary(s => s.Id, s => s.Name);

        var lines = new List<InvoiceLine>();
        foreach (var s in intervention.Services.OrderBy(s => names.GetValueOrDefault(s.ServiceId)))
        {
            var name = names.GetValueOrDefault(s.ServiceId) ?? "Prestation";
            lines.Add(Line(InvoiceLineKind.Labour, s.LabourMinutes is int m ? $"{name} — main-d'œuvre {m} min" : name, null, s.Quantity, s.UnitPrice));
        }

        foreach (var p in intervention.SpareParts.OrderBy(p => p.CreatedAt))
        {
            lines.Add(Line(InvoiceLineKind.Part, p.Name, p.Reference, p.Quantity, p.UnitPrice));
        }

        if (lines.Count == 0)
        {
            throw new BusinessException("Rien à facturer : ajoutez la main-d'œuvre ou des pièces.");
        }

        for (var i = 0; i < lines.Count; i++)
        {
            lines[i].SortOrder = (short)i;
        }

        var now = _clock.GetUtcNow().UtcDateTime;
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(now, _tenant.TimeZone));
        var totalTtc = lines.Sum(l => l.Total);
        var totalHt = Math.Round(totalTtc / (1 + InvoiceRules.VatRate), 2, MidpointRounding.AwayFromZero);

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
        }, cancellationToken);

        return invoice.Id;
    }

    private static InvoiceLine Line(InvoiceLineKind kind, string label, string? reference, decimal quantity, decimal unitPrice) => new()
    {
        Kind = kind,
        Label = label,
        Reference = reference,
        Quantity = quantity,
        UnitPrice = unitPrice,
        Total = Math.Round(quantity * unitPrice, 2, MidpointRounding.AwayFromZero),
    };
}

// ============================================================
// ENCAISSER (un seul paiement du montant total)
// ============================================================

public class PayInvoiceCommand : IRequest<Unit>
{
    public long InvoiceId { get; set; }

    // card, cash, transfer, check
    public string Method { get; set; } = null!;
}

public class PayInvoiceCommandValidator : AbstractValidator<PayInvoiceCommand>
{
    public PayInvoiceCommandValidator()
    {
        RuleFor(x => x.Method)
            .Must(m => m is "card" or "cash" or "transfer" or "check")
            .WithMessage("Moyen de paiement attendu : carte, espèces, virement ou chèque.");
    }
}

public class PayInvoiceCommandHandler : IRequestHandler<PayInvoiceCommand, Unit>
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPaymentRepository _payments;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public PayInvoiceCommandHandler(IInvoiceRepository invoices, IPaymentRepository payments, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _invoices = invoices;
        _payments = payments;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    /// <summary>Encaisse le montant total de la facture : elle est payée, l'intervention est clôturée.</summary>
    public async Task<Unit> Handle(PayInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoices.GetByIdAsync(request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException($"Facture {request.InvoiceId} introuvable.");

        if (invoice.Status != InvoiceStatus.Issued)
        {
            throw new BusinessException("Cette facture est déjà réglée ou annulée.");
        }

        var now = _clock.GetUtcNow().UtcDateTime;
        await _payments.AddAsync(new Payment
        {
            InvoiceId = invoice.Id,
            Amount = invoice.TotalTtc,
            Method = Enum.Parse<PaymentMethod>(request.Method, ignoreCase: true),
            Status = PaymentStatus.Succeeded,
            PaidAt = now,
            CreatedAt = now,
        }, cancellationToken);

        invoice.Status = InvoiceStatus.Paid;
        invoice.UpdatedAt = now;
        _invoices.Update(invoice);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
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
