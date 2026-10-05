using Atelio.Application.Common;
using Atelio.Application.Features.Garages.Responses;
using Atelio.Domain;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Garages.Queries;

/// <summary>Places libres du garage par demi-heure d'ouverture (calendrier du back-office).</summary>
public class GetGarageCapacityQuery : IRequest<IReadOnlyList<CapacityResponse>>
{
    public long GarageId { get; set; }

    // Premier et dernier jour inclus, heure locale du garage.
    public DateOnly From { get; set; }

    public DateOnly To { get; set; }
}

public class GetGarageCapacityQueryValidator : AbstractValidator<GetGarageCapacityQuery>
{
    public GetGarageCapacityQueryValidator()
    {
        RuleFor(x => x.To).GreaterThanOrEqualTo(x => x.From).WithMessage("La période est invalide.");
        RuleFor(x => x).Must(x => x.To.DayNumber - x.From.DayNumber <= 62).WithMessage("La période ne peut pas dépasser 2 mois.");
    }
}

public class GetGarageCapacityQueryHandler : IRequestHandler<GetGarageCapacityQuery, IReadOnlyList<CapacityResponse>>
{
    private readonly IGarageRepository _garages;
    private readonly IPlanningRepository _planning;
    private readonly ITenantContext _tenant;

    public GetGarageCapacityQueryHandler(IGarageRepository garages, IPlanningRepository planning, ITenantContext tenant)
    {
        _garages = garages;
        _planning = planning;
        _tenant = tenant;
    }

    public async Task<IReadOnlyList<CapacityResponse>> Handle(GetGarageCapacityQuery request, CancellationToken cancellationToken)
    {
        var garage = await _garages.GetByIdAsync(request.GarageId, cancellationToken);
        if (garage is null || !garage.IsActive)
        {
            throw new NotFoundException($"Garage {request.GarageId} introuvable.");
        }

        var planner = await BookingRules.CreatePlannerAsync(_planning, _tenant, garage, request.From, request.To, cancellationToken);

        var result = new List<CapacityResponse>();
        for (var day = request.From; day <= request.To; day = day.AddDays(1))
        {
            result.AddRange(planner.GetCapacity(day).Select(p => new CapacityResponse
            {
                Start = p.Start,
                End = p.End,
                Free = p.Free,
                Total = p.Total,
            }));
        }

        return result;
    }
}
