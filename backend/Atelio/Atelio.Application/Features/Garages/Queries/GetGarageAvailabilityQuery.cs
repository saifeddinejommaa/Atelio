using Atelio.Application.Common;
using Atelio.Application.Features.Garages.Responses;
using Atelio.Domain;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Garages.Queries;

/// <summary>Créneaux d'un garage pour les services demandés, jour par jour.</summary>
public class GetGarageAvailabilityQuery : IRequest<IReadOnlyList<GarageDayAvailabilityResponse>>
{
    public long GarageId { get; set; }

    public List<long> ServiceIds { get; set; } = [];

    // Premier jour (heure locale du garage). Par défaut : demain.
    public DateOnly? From { get; set; }

    public int Days { get; set; } = 14;
}

public class GetGarageAvailabilityQueryValidator : AbstractValidator<GetGarageAvailabilityQuery>
{
    public GetGarageAvailabilityQueryValidator()
    {
        RuleFor(x => x.ServiceIds).NotEmpty().WithMessage("Choisissez au moins un service.");
        RuleFor(x => x.Days).InclusiveBetween(1, 31);
    }
}

public class GetGarageAvailabilityQueryHandler
    : IRequestHandler<GetGarageAvailabilityQuery, IReadOnlyList<GarageDayAvailabilityResponse>>
{
    private readonly IGarageRepository _garages;
    private readonly IServiceRepository _services;
    private readonly IPlanningRepository _planning;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public GetGarageAvailabilityQueryHandler(
        IGarageRepository garages,
        IServiceRepository services,
        IPlanningRepository planning,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _garages = garages;
        _services = services;
        _planning = planning;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<IReadOnlyList<GarageDayAvailabilityResponse>> Handle(
        GetGarageAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        var garage = await _garages.GetByIdAsync(request.GarageId, cancellationToken);
        if (garage is null || !garage.IsActive)
        {
            throw new NotFoundException($"Garage {request.GarageId} introuvable.");
        }

        var work = await BookingRules.GetWorkAsync(_garages, _services, garage.Id, request.ServiceIds, cancellationToken);

        var nowUtc = _clock.GetUtcNow().UtcDateTime;
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(nowUtc, _tenant.TimeZone));
        var from = request.From ?? today.AddDays(1);
        var to = from.AddDays(request.Days);

        var planner = await BookingRules.CreatePlannerAsync(_planning, _tenant, garage, from, to, cancellationToken);

        // Site client : une prestation à durée incertaine (ex. « Autre ») ne se réserve que le matin.
        var latestStart = work.Uncertain ? BookingRules.UncertainLatestStart : (TimeOnly?)null;

        var result = new List<GarageDayAvailabilityResponse>();
        for (var day = from; day < to; day = day.AddDays(1))
        {
            var slots = planner.GetSlots(day, work.Minutes, nowUtc, latestStart);
            if (slots.Count == 0)
            {
                continue; // garage fermé ce jour-là
            }

            result.Add(new GarageDayAvailabilityResponse
            {
                Date = day.ToString("yyyy-MM-dd"),
                Slots = slots
                    .Select(s => new GarageSlotResponse { Time = s.LocalStart.ToString("HH:mm"), Available = s.Available })
                    .ToList(),
            });
        }

        return result;
    }
}
