using Atelio.Application.Common;
using Atelio.Application.Features.Garages.Responses;
using Atelio.Domain;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Garages.Queries;

/// <summary>
/// Un rendez-vous peut-il être placé à cette heure ? Durée : celle des prestations demandées,
/// ou celle du rendez-vous qu'on déplace (qui n'est alors pas compté comme occupé).
/// </summary>
public class CheckGarageSlotQuery : IRequest<SlotCheckResponse>
{
    public long GarageId { get; set; }

    // Heure locale du garage, ex. "2026-10-12T14:00".
    public DateTime ScheduledAt { get; set; }

    public List<long> ServiceIds { get; set; } = [];

    // Référence du rendez-vous déplacé.
    public string? ExcludeAppointment { get; set; }
}

public class CheckGarageSlotQueryValidator : AbstractValidator<CheckGarageSlotQuery>
{
    public CheckGarageSlotQueryValidator()
    {
        RuleFor(x => x)
            .Must(x => x.ServiceIds.Count > 0 || !string.IsNullOrWhiteSpace(x.ExcludeAppointment))
            .WithMessage("Indiquez les prestations ou le rendez-vous à déplacer.");
    }
}

public class CheckGarageSlotQueryHandler : IRequestHandler<CheckGarageSlotQuery, SlotCheckResponse>
{
    private readonly IGarageRepository _garages;
    private readonly IServiceRepository _services;
    private readonly IAppointmentRepository _appointments;
    private readonly IPlanningRepository _planning;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public CheckGarageSlotQueryHandler(
        IGarageRepository garages,
        IServiceRepository services,
        IAppointmentRepository appointments,
        IPlanningRepository planning,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _garages = garages;
        _services = services;
        _appointments = appointments;
        _planning = planning;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<SlotCheckResponse> Handle(CheckGarageSlotQuery request, CancellationToken cancellationToken)
    {
        var garage = await _garages.GetByIdAsync(request.GarageId, cancellationToken);
        if (garage is null || !garage.IsActive)
        {
            throw new NotFoundException($"Garage {request.GarageId} introuvable.");
        }

        var excluded = string.IsNullOrWhiteSpace(request.ExcludeAppointment)
            ? null
            : await _appointments.GetByReferenceAsync(request.ExcludeAppointment, cancellationToken)
                ?? throw new NotFoundException($"Rendez-vous {request.ExcludeAppointment} introuvable.");

        var work = request.ServiceIds.Count > 0
            ? await BookingRules.GetWorkAsync(_garages, _services, garage.Id, request.ServiceIds, cancellationToken)
            : await BookingRules.GetAppointmentWorkAsync(_services, excluded!, cancellationToken);

        var localStart = DateTime.SpecifyKind(request.ScheduledAt, DateTimeKind.Unspecified);
        var day = DateOnly.FromDateTime(localStart);

        var planner = await BookingRules.CreatePlannerAsync(_planning, _tenant, garage, day, day, cancellationToken, excluded?.Id);
        var placement = planner.TryPlace(localStart, work.Minutes, _clock.GetUtcNow().UtcDateTime);

        return new SlotCheckResponse
        {
            Available = placement.Available,
            Message = placement.Reason,
            DurationMinutes = work.Minutes,
            EstimatedEndAt = placement.EndUtc,
            Warning = placement.Available ? BookingRules.UncertainWarning(work, localStart) : null,
        };
    }
}
