using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Vehicles.Commands;

// ============================================================
// CREATE (ou mise à jour si le client a déjà cette immatriculation)
// ============================================================

public class SaveVehicleCommand : IRequest<long>
{
    public long CustomerId { get; set; }

    public string Plate { get; set; } = null!;

    public string? Make { get; set; }

    public string? Model { get; set; }

    public short? Year { get; set; }

    public VehicleFuel? Fuel { get; set; }

    public VehicleCategory? Category { get; set; }

    public int? Mileage { get; set; }
}

public class SaveVehicleCommandValidator : AbstractValidator<SaveVehicleCommand>
{
    public SaveVehicleCommandValidator()
    {
        RuleFor(x => x.CustomerId).GreaterThan(0);
        RuleFor(x => x.Plate).Must(TextRules.IsValidPlate).WithMessage("Immatriculation invalide (format AB-123-CD).");
        RuleFor(x => x.Make).MaximumLength(50);
        RuleFor(x => x.Model).MaximumLength(80);
        RuleFor(x => x.Year).InclusiveBetween((short)1950, (short)2100).When(x => x.Year.HasValue);
        RuleFor(x => x.Mileage).GreaterThanOrEqualTo(0).When(x => x.Mileage.HasValue);
    }
}

public class SaveVehicleCommandHandler : IRequestHandler<SaveVehicleCommand, long>
{
    private readonly IVehicleRepository _vehicles;
    private readonly ICustomerRepository _customers;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public SaveVehicleCommandHandler(
        IVehicleRepository vehicles,
        ICustomerRepository customers,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _vehicles = vehicles;
        _customers = customers;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<long> Handle(SaveVehicleCommand request, CancellationToken cancellationToken)
    {
        _ = await _customers.GetByIdAsync(request.CustomerId, cancellationToken)
            ?? throw new NotFoundException($"Client {request.CustomerId} introuvable.");

        var vehicle = await VehicleRules.SaveAsync(_vehicles, request, _clock.GetUtcNow().UtcDateTime, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return vehicle.Id;
    }
}

// ============================================================
// INFORMATIONS DU VÉHICULE (saisies par le garage avant l'entrée en atelier)
// ============================================================

public class UpdateVehicleDetailsCommand : IRequest<Unit>
{
    public long VehicleId { get; set; }

    public string Make { get; set; } = null!;

    public string Model { get; set; } = null!;

    public string Version { get; set; } = null!;

    // Date de 1re mise en circulation (carte grise, case B).
    public DateOnly FirstRegistration { get; set; }

    public VehicleFuel Fuel { get; set; }

    public VehicleGearbox Gearbox { get; set; }

    // Poids en kg, facultatif.
    public int? WeightKg { get; set; }
}

public class UpdateVehicleDetailsCommandValidator : AbstractValidator<UpdateVehicleDetailsCommand>
{
    public UpdateVehicleDetailsCommandValidator(TimeProvider clock)
    {
        RuleFor(x => x.Make).NotEmpty().WithMessage("Indiquez la marque.").MaximumLength(50);
        RuleFor(x => x.Model).NotEmpty().WithMessage("Indiquez le modèle.").MaximumLength(80);
        RuleFor(x => x.Version).NotEmpty().WithMessage("Indiquez la version.").MaximumLength(80);
        RuleFor(x => x.FirstRegistration)
            .Must(d => d.Year >= 1950 && d <= DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime))
            .WithMessage("Date de 1re mise en circulation invalide.");
        RuleFor(x => x.Fuel).IsInEnum().WithMessage("Choisissez l'énergie.");
        RuleFor(x => x.Gearbox).IsInEnum().WithMessage("Choisissez la boîte de vitesses.");
        RuleFor(x => x.WeightKg).InclusiveBetween(100, 60000).WithMessage("Poids invalide (en kg).").When(x => x.WeightKg.HasValue);
    }
}

public class UpdateVehicleDetailsCommandHandler : IRequestHandler<UpdateVehicleDetailsCommand, Unit>
{
    private readonly IVehicleRepository _vehicles;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public UpdateVehicleDetailsCommandHandler(IVehicleRepository vehicles, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _vehicles = vehicles;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(UpdateVehicleDetailsCommand request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicles.GetByIdAsync(request.VehicleId, cancellationToken)
            ?? throw new NotFoundException($"Véhicule {request.VehicleId} introuvable.");

        vehicle.Make = request.Make.Trim().ToUpperInvariant();
        vehicle.Model = request.Model.Trim();
        vehicle.Version = request.Version.Trim();
        vehicle.FirstRegistration = request.FirstRegistration;
        vehicle.Year = (short)request.FirstRegistration.Year;
        vehicle.Fuel = request.Fuel;
        vehicle.Gearbox = request.Gearbox;
        vehicle.WeightKg = request.WeightKg;
        vehicle.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        _vehicles.Update(vehicle);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class VehicleRules
{
    /// <summary>Retrouve le véhicule du client par immatriculation, ou le crée.</summary>
    public static async Task<Vehicle> SaveAsync(
        IVehicleRepository vehicles,
        SaveVehicleCommand request,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var plate = TextRules.NormalizePlate(request.Plate);
        var vehicle = await vehicles.GetByPlateAsync(request.CustomerId, plate, cancellationToken);

        if (vehicle is null)
        {
            vehicle = new Vehicle { CustomerId = request.CustomerId, Plate = plate, CreatedAt = nowUtc };
            await vehicles.AddAsync(vehicle, cancellationToken);
        }

        // Les champs fournis complètent ou remplacent les informations connues.
        vehicle.Make = TextRules.Clean(request.Make) ?? vehicle.Make;
        vehicle.Model = TextRules.Clean(request.Model) ?? vehicle.Model;
        vehicle.Year = request.Year ?? vehicle.Year;
        vehicle.Fuel = request.Fuel ?? vehicle.Fuel;
        vehicle.Category = request.Category ?? vehicle.Category;
        vehicle.Mileage = request.Mileage ?? vehicle.Mileage;
        vehicle.IsActive = true;
        vehicle.UpdatedAt = nowUtc;

        return vehicle;
    }
}
