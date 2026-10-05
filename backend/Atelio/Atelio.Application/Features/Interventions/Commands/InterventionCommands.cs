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

        if (intervention.Status is InterventionStatus.Done or InterventionStatus.Cancelled)
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
