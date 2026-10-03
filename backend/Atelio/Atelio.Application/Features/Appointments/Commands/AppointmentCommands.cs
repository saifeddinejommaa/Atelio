using Atelio.Application.Common;
using Atelio.Application.Features.Appointments.Responses;
using Atelio.Application.Features.Vehicles.Commands;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Planning;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;
using System.Security.Cryptography;

namespace Atelio.Application.Features.Appointments.Commands;

// ============================================================
// CREATE
// ============================================================

public class CreateAppointmentCommand : IRequest<AppointmentCreatedResponse>
{
    public long CustomerId { get; set; }

    public long GarageId { get; set; }

    public List<long> ServiceIds { get; set; } = [];

    // Heure locale du garage, ex. "2026-10-05T09:30".
    public DateTime ScheduledAt { get; set; }

    // Véhicule existant du client, ou immatriculation (créé si inconnu).
    public long? VehicleId { get; set; }

    public string? Plate { get; set; }

    public int? Mileage { get; set; }

    // « Quelque chose à signaler au garage ? »
    public string? CustomerNotes { get; set; }
}

public class CreateAppointmentCommandValidator : AbstractValidator<CreateAppointmentCommand>
{
    public CreateAppointmentCommandValidator()
    {
        RuleFor(x => x.CustomerId).GreaterThan(0);
        RuleFor(x => x.GarageId).GreaterThan(0).WithMessage("Choisissez un garage.");
        RuleFor(x => x.ServiceIds).NotEmpty().WithMessage("Choisissez au moins un service.");
        RuleFor(x => x)
            .Must(x => x.VehicleId.HasValue || TextRules.IsValidPlate(x.Plate))
            .WithMessage("Indiquez un véhicule ou une immatriculation valide (format AB-123-CD).");
        RuleFor(x => x.Mileage).GreaterThanOrEqualTo(0).When(x => x.Mileage.HasValue);
        RuleFor(x => x.CustomerNotes).MaximumLength(1000);
    }
}

public class CreateAppointmentCommandHandler : IRequestHandler<CreateAppointmentCommand, AppointmentCreatedResponse>
{
    private readonly IAppointmentRepository _appointments;
    private readonly ICustomerRepository _customers;
    private readonly IVehicleRepository _vehicles;
    private readonly IGarageRepository _garages;
    private readonly IServiceRepository _services;
    private readonly IPlanningRepository _planning;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public CreateAppointmentCommandHandler(
        IAppointmentRepository appointments,
        ICustomerRepository customers,
        IVehicleRepository vehicles,
        IGarageRepository garages,
        IServiceRepository services,
        IPlanningRepository planning,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _appointments = appointments;
        _customers = customers;
        _vehicles = vehicles;
        _garages = garages;
        _services = services;
        _planning = planning;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<AppointmentCreatedResponse> Handle(CreateAppointmentCommand request, CancellationToken cancellationToken)
    {
        var nowUtc = _clock.GetUtcNow().UtcDateTime;

        var customer = await _customers.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer is null || !customer.IsActive)
        {
            throw new NotFoundException($"Client {request.CustomerId} introuvable.");
        }

        var garage = await _garages.GetByIdAsync(request.GarageId, cancellationToken);
        if (garage is null || !garage.IsActive)
        {
            throw new NotFoundException($"Garage {request.GarageId} introuvable.");
        }

        var duration = await BookingRules.GetDurationAsync(
            _garages, _services, garage.Id, request.ServiceIds, cancellationToken);

        Appointment appointment = null!;

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            // Une seule réservation à la fois par garage : la capacité ne peut pas être dépassée.
            await _appointments.LockGarageScheduleAsync(garage.Id, ct);

            var localStart = DateTime.SpecifyKind(request.ScheduledAt, DateTimeKind.Unspecified);
            var startUtc = TimeZoneInfo.ConvertTimeToUtc(localStart, _tenant.TimeZone);
            var endUtc = startUtc.AddMinutes(duration);

            var planner = new SlotPlanner(
                garage,
                _tenant.TimeZone,
                await _planning.GetMechanicsAsync(garage.Id, startUtc, endUtc, ct),
                await _planning.GetBookedPeriodsAsync(garage.Id, startUtc, endUtc, ct));

            if (!planner.IsWithinOpeningHours(localStart, duration))
            {
                throw new BusinessException(
                    $"Le garage est fermé à ce moment-là (ouvert de {garage.OpeningTime:HH\\:mm} à {garage.ClosingTime:HH\\:mm}, "
                    + $"et le rendez-vous dure {duration} min).");
            }

            if (startUtc <= nowUtc)
            {
                throw new BusinessException("Ce créneau est déjà passé.");
            }

            if (!planner.CanBook(localStart, duration, nowUtc))
            {
                throw new BusinessException("Ce créneau n'est plus disponible, merci d'en choisir un autre.");
            }

            var vehicle = await ResolveVehicleAsync(request, nowUtc, ct);

            appointment = new Appointment
            {
                Reference = await NewReferenceAsync(ct),
                CustomerId = customer.Id,
                Vehicle = vehicle,
                GarageId = garage.Id,
                ScheduledAt = startUtc,
                EstimatedEndAt = endUtc,
                Status = AppointmentStatus.Confirmed,
                CustomerNotes = TextRules.Clean(request.CustomerNotes),
                CreatedAt = nowUtc,
                UpdatedAt = nowUtc,
                Services = request.ServiceIds.Distinct().Select(id => new AppointmentService { ServiceId = id }).ToList(),
            };

            await _appointments.AddAsync(appointment, ct);
        }, cancellationToken);

        return new AppointmentCreatedResponse
        {
            Id = appointment.Id,
            Reference = appointment.Reference,
            ScheduledAt = appointment.ScheduledAt,
            EstimatedEndAt = appointment.EstimatedEndAt,
        };
    }

    private async Task<Vehicle> ResolveVehicleAsync(CreateAppointmentCommand request, DateTime nowUtc, CancellationToken ct)
    {
        if (request.VehicleId is long vehicleId)
        {
            var vehicle = await _vehicles.GetByIdAsync(vehicleId, ct);
            if (vehicle is null || vehicle.CustomerId != request.CustomerId)
            {
                throw new NotFoundException($"Véhicule {vehicleId} introuvable.");
            }

            if (request.Mileage is int mileage)
            {
                vehicle.Mileage = mileage;
                vehicle.UpdatedAt = nowUtc;
            }

            return vehicle;
        }

        return await VehicleRules.SaveAsync(
            _vehicles,
            new SaveVehicleCommand { CustomerId = request.CustomerId, Plate = request.Plate!, Mileage = request.Mileage },
            nowUtc,
            ct);
    }

    private async Task<string> NewReferenceAsync(CancellationToken ct)
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O ni 1/I
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var reference = "RDV-" + RandomNumberGenerator.GetString(alphabet, 6);
            if (!await _appointments.ReferenceExistsAsync(reference, ct))
            {
                return reference;
            }
        }

        throw new InvalidOperationException("Impossible de générer une référence de rendez-vous unique.");
    }
}

// ============================================================
// CANCEL
// ============================================================

public class CancelAppointmentCommand : IRequest<Unit>
{
    public string Reference { get; set; } = null!;

    // Le client qui annule doit être le titulaire du rendez-vous.
    public long CustomerId { get; set; }
}

public class CancelAppointmentCommandHandler : IRequestHandler<CancelAppointmentCommand, Unit>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public CancelAppointmentCommandHandler(IAppointmentRepository appointments, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _appointments = appointments;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(CancelAppointmentCommand request, CancellationToken cancellationToken)
    {
        var appointment = await _appointments.GetByReferenceAsync(request.Reference, cancellationToken);
        if (appointment is null || appointment.CustomerId != request.CustomerId)
        {
            throw new NotFoundException($"Rendez-vous {request.Reference} introuvable.");
        }

        if (appointment.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
        {
            throw new BusinessException("Ce rendez-vous ne peut plus être annulé.");
        }

        if (appointment.ScheduledAt <= _clock.GetUtcNow().UtcDateTime)
        {
            throw new BusinessException("Un rendez-vous passé ne peut pas être annulé.");
        }

        appointment.Status = AppointmentStatus.Cancelled;
        _appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
