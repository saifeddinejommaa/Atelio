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
