using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Planning;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Appointments.Commands;

// Actions du garage sur un rendez-vous (back-office).

// ============================================================
// RESCHEDULE
// ============================================================

public class RescheduleAppointmentCommand : IRequest<Unit>
{
    public string Reference { get; set; } = null!;

    // Nouvelle heure locale du garage.
    public DateTime ScheduledAt { get; set; }
}

public class RescheduleAppointmentCommandHandler : IRequestHandler<RescheduleAppointmentCommand, Unit>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IGarageRepository _garages;
    private readonly IServiceRepository _services;
    private readonly IPlanningRepository _planning;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public RescheduleAppointmentCommandHandler(
        IAppointmentRepository appointments,
        IGarageRepository garages,
        IServiceRepository services,
        IPlanningRepository planning,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _appointments = appointments;
        _garages = garages;
        _services = services;
        _planning = planning;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<Unit> Handle(RescheduleAppointmentCommand request, CancellationToken cancellationToken)
    {
        var nowUtc = _clock.GetUtcNow().UtcDateTime;
        var appointment = await GarageAppointmentRules.GetOpenAsync(_appointments, request.Reference, cancellationToken);

        if (appointment.ScheduledAt <= nowUtc)
        {
            throw new BusinessException("Un rendez-vous déjà commencé ne peut plus être déplacé.");
        }

        var garage = await _garages.GetByIdAsync(appointment.GarageId, cancellationToken)
            ?? throw new NotFoundException($"Garage {appointment.GarageId} introuvable.");

        // Même travail qu'à la réservation ; la fin estimée est recalculée (pauses du nouveau créneau).
        var workMinutes = (await BookingRules.GetAppointmentWorkAsync(_services, appointment, cancellationToken)).Minutes;

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await _appointments.LockGarageScheduleAsync(garage.Id, ct);

            var localStart = DateTime.SpecifyKind(request.ScheduledAt, DateTimeKind.Unspecified);
            var day = DateOnly.FromDateTime(localStart);

            var planner = await BookingRules.CreatePlannerAsync(_planning, _tenant, garage, day, day, ct, excludeAppointmentId: appointment.Id);
            var placement = planner.TryPlace(localStart, workMinutes, nowUtc);
            if (!placement.Available)
            {
                throw new BusinessException(placement.Reason!);
            }

            appointment.ScheduledAt = TimeZoneInfo.ConvertTimeToUtc(localStart, _tenant.TimeZone);
            appointment.EstimatedEndAt = placement.EndUtc!.Value;
            appointment.UpdatedAt = nowUtc;
            _appointments.Update(appointment);
        }, cancellationToken);

        return Unit.Value;
    }
}

// ============================================================
// ABANDON (annulé par le garage, ou client non venu)
// ============================================================

public class AbandonAppointmentCommand : IRequest<Unit>
{
    public string Reference { get; set; } = null!;

    // Cancelled (annulé) ou NoShow (client non venu).
    public AppointmentStatus Status { get; set; }
}

public class AbandonAppointmentCommandValidator : AbstractValidator<AbandonAppointmentCommand>
{
    public AbandonAppointmentCommandValidator()
    {
        RuleFor(x => x.Status)
            .Must(s => s is AppointmentStatus.Cancelled or AppointmentStatus.NoShow)
            .WithMessage($"Statut attendu : {(int)AppointmentStatus.Cancelled} (annulé) ou {(int)AppointmentStatus.NoShow} (client non venu).");
    }
}

public class AbandonAppointmentCommandHandler : IRequestHandler<AbandonAppointmentCommand, Unit>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public AbandonAppointmentCommandHandler(IAppointmentRepository appointments, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _appointments = appointments;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(AbandonAppointmentCommand request, CancellationToken cancellationToken)
    {
        var nowUtc = _clock.GetUtcNow().UtcDateTime;
        var appointment = await GarageAppointmentRules.GetOpenAsync(_appointments, request.Reference, cancellationToken);

        if (request.Status == AppointmentStatus.NoShow && appointment.ScheduledAt > nowUtc)
        {
            throw new BusinessException("Le client ne peut être noté absent qu'à partir de l'heure du rendez-vous.");
        }

        appointment.Status = request.Status;
        appointment.UpdatedAt = nowUtc;
        _appointments.Update(appointment);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

// ============================================================
// START (le client est là : on ouvre l'intervention)
// ============================================================

public class StartAppointmentCommand : IRequest<long>
{
    public string Reference { get; set; } = null!;

    // Début réel, heure locale du garage (ex. "2026-10-12T14:20"). Par défaut : maintenant.
    public DateTime? StartAt { get; set; }
}

public class StartAppointmentCommandHandler : IRequestHandler<StartAppointmentCommand, long>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IInterventionRepository _interventions;
    private readonly IServiceRepository _services;
    private readonly IServiceCategoryRepository _categories;
    private readonly IGarageRepository _garages;
    private readonly IPlanningRepository _planning;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public StartAppointmentCommandHandler(
        IAppointmentRepository appointments,
        IInterventionRepository interventions,
        IServiceRepository services,
        IServiceCategoryRepository categories,
        IGarageRepository garages,
        IPlanningRepository planning,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _appointments = appointments;
        _interventions = interventions;
        _services = services;
        _categories = categories;
        _garages = garages;
        _planning = planning;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    /// <summary>
    /// Crée l'intervention (en cours) à partir du rendez-vous et renvoie son identifiant. Le rendez-vous est recalé
    /// sur l'heure réelle de début ; s'il n'y a pas de mécanicien libre, on lance quand même (le client est là),
    /// sans mécanicien affecté.
    /// </summary>
    public async Task<long> Handle(StartAppointmentCommand request, CancellationToken cancellationToken)
    {
        var nowUtc = _clock.GetUtcNow().UtcDateTime;
        var appointment = await GarageAppointmentRules.GetOpenAsync(_appointments, request.Reference, cancellationToken);
        var start = await GarageAppointmentRules.EvaluateStartAsync(
            appointment, request.StartAt, _services, _garages, _planning, _tenant, nowUtc, cancellationToken);

        // Main-d'œuvre de chaque prestation : taux horaire de sa catégorie × durée (les pièces s'ajoutent à part).
        var serviceIds = appointment.Services.Select(s => s.ServiceId).ToList();
        var services = (await _services.GetActiveByIdsAsync(serviceIds, cancellationToken)).ToDictionary(s => s.Id);
        var rates = (await _categories.GetAllAsync(cancellationToken)).ToDictionary(c => c.Id, c => c.HourlyRate);

        InterventionService ToLine(long serviceId)
        {
            var service = services.GetValueOrDefault(serviceId);
            var minutes = service?.DurationMinutes;
            var categoryId = service?.CategoryId;
            var rate = categoryId is long id ? rates.GetValueOrDefault(id) : 0m;
            return new InterventionService
            {
                ServiceId = serviceId,
                Quantity = 1,
                LabourMinutes = minutes,
                CategoryId = categoryId,
                UnitPrice = minutes is int m ? Pricing.Labour(rate, m) : 0m,
            };
        }

        var intervention = new Intervention
        {
            AppointmentId = appointment.Id,
            CustomerId = appointment.CustomerId,
            VehicleId = appointment.VehicleId,
            GarageId = appointment.GarageId,
            // Premier mécanicien libre ; modifiable dans l'intervention.
            EmployeeId = start.Placement.EmployeeId,
            Status = InterventionStatus.InProgress,
            StartedAt = start.StartUtc,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
            Services = serviceIds.Select(ToLine).ToList(),
        };

        // Le client est venu : le rendez-vous est honoré, recalé sur l'heure réelle.
        appointment.ScheduledAt = start.StartUtc;
        appointment.EstimatedEndAt = start.EndUtc;
        appointment.Status = AppointmentStatus.Completed;
        appointment.UpdatedAt = nowUtc;
        _appointments.Update(appointment);

        await _interventions.AddAsync(intervention, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return intervention.Id;
    }
}

/// <summary>Lancement évalué : début et fin estimée (UTC), et placement (mécanicien libre, ou raison).</summary>
internal record StartEvaluation(DateTime StartUtc, DateTime EndUtc, Placement Placement);

internal static class GarageAppointmentRules
{
    /// <summary>
    /// Lancement d'un rendez-vous à une heure locale (par défaut maintenant) : uniquement le jour prévu, qui doit être
    /// aujourd'hui. Cherche le premier mécanicien libre pour tout le travail, sans compter le rendez-vous lui-même.
    /// </summary>
    public static async Task<StartEvaluation> EvaluateStartAsync(
        Appointment appointment,
        DateTime? requestedStart,
        IServiceRepository services,
        IGarageRepository garages,
        IPlanningRepository planning,
        ITenantContext tenant,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tenant.TimeZone);
        var localStart = DateTime.SpecifyKind(requestedStart ?? nowLocal, DateTimeKind.Unspecified);
        localStart = localStart.AddTicks(-(localStart.Ticks % TimeSpan.TicksPerMinute));

        var today = DateOnly.FromDateTime(nowLocal);
        var plannedDay = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(appointment.ScheduledAt, tenant.TimeZone));
        if (plannedDay != today)
        {
            throw new BusinessException("Un rendez-vous ne peut être lancé que le jour prévu.");
        }

        if (DateOnly.FromDateTime(localStart) != today)
        {
            throw new BusinessException("L'heure de début doit être aujourd'hui.");
        }

        var garage = await garages.GetByIdAsync(appointment.GarageId, cancellationToken)
            ?? throw new NotFoundException($"Garage {appointment.GarageId} introuvable.");
        var work = await BookingRules.GetAppointmentWorkAsync(services, appointment, cancellationToken);
        var planner = await BookingRules.CreatePlannerAsync(planning, tenant, garage, today, today, cancellationToken, appointment.Id);

        var placement = planner.TryStart(localStart, work.Minutes);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(localStart, tenant.TimeZone);
        return new StartEvaluation(startUtc, placement.EndUtc ?? startUtc.AddMinutes(work.Minutes), placement);
    }

    /// <summary>Rendez-vous encore ouvert (en attente ou confirmé), sinon erreur.</summary>
    public static async Task<Appointment> GetOpenAsync(
        IAppointmentRepository appointments, string reference, CancellationToken cancellationToken)
    {
        var appointment = await appointments.GetByReferenceAsync(reference, cancellationToken)
            ?? throw new NotFoundException($"Rendez-vous {reference} introuvable.");

        if (appointment.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
        {
            throw new BusinessException("Ce rendez-vous est déjà clos (annulé, terminé ou client absent).");
        }

        return appointment;
    }
}
