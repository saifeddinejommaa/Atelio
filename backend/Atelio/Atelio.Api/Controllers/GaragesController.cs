using Atelio.Application.Features.Garages.Queries;
using Atelio.Application.Features.Garages.Repositories;
using Atelio.Application.Features.Garages.Requests;
using Atelio.Application.Features.Garages.Responses;
using Atelio.Application.Features.Team.Queries;
using Atelio.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GaragesController : ControllerBase
{
    private readonly IGarageQueryRepository _queryRepository;
    private readonly IEmployeeRepository _employees;
    private readonly IMediator _mediator;

    public GaragesController(IGarageQueryRepository queryRepository, IEmployeeRepository employees, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _employees = employees;
        _mediator = mediator;
    }

    /// <summary>Garages actifs (page « Trouver un garage »).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GaragesRequestFilter filter, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetGaragesAsync(filter, cancellationToken));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await _queryRepository.GetByIdAsync(id, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Créneaux du garage pour les services demandés, jour par jour.
    /// Ex. : GET /api/garages/1/availability?serviceIds=1&amp;serviceIds=2&amp;from=2026-10-05&amp;days=14
    /// </summary>
    [HttpGet("{id:long}/availability")]
    public async Task<IActionResult> GetAvailability(
        long id,
        [FromQuery] List<long> serviceIds,
        [FromQuery] DateOnly? from,
        [FromQuery] int days = 14,
        CancellationToken cancellationToken = default)
    {
        return Ok(await _mediator.Send(
            new GetGarageAvailabilityQuery { GarageId = id, ServiceIds = serviceIds, From = from, Days = days },
            cancellationToken));
    }

    /// <summary>
    /// Équipe du garage : employés actifs avec leur planning type et leurs absences sur la période (jours locaux inclus).
    /// Ex. : GET /api/garages/2/team?from=2026-10-12&amp;to=2026-10-18
    /// </summary>
    [HttpGet("{id:long}/team")]
    public async Task<IActionResult> GetTeam(long id, [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(new GetTeamQuery { GarageId = id, From = from, To = to }, cancellationToken));
    }

    /// <summary>Mécaniciens actifs du garage (affectation des interventions).</summary>
    [HttpGet("{id:long}/mechanics")]
    public async Task<IActionResult> GetMechanics(long id, CancellationToken cancellationToken)
    {
        var mechanics = await _employees.GetActiveMechanicsAsync(id, cancellationToken);

        return Ok(mechanics.Select(MechanicResponse.From));
    }

    /// <summary>
    /// Places libres par demi-heure d'ouverture : [{ start, end, free, total }] (UTC), jours inclus en heure locale.
    /// Ex. : GET /api/garages/2/capacity?from=2026-10-12&amp;to=2026-10-18
    /// </summary>
    [HttpGet("{id:long}/capacity")]
    public async Task<IActionResult> GetCapacity(
        long id,
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(new GetGarageCapacityQuery { GarageId = id, From = from, To = to }, cancellationToken));
    }

    /// <summary>
    /// Vérifie un créneau : { available, message, durationMinutes }. Durée des prestations (serviceIds),
    /// ou du rendez-vous déplacé (excludeAppointment, qui n'est alors pas compté comme occupé).
    /// Ex. : GET /api/garages/2/slot-check?scheduledAt=2026-10-12T14:00&amp;serviceIds=1&amp;serviceIds=4
    /// </summary>
    [HttpGet("{id:long}/slot-check")]
    public async Task<IActionResult> CheckSlot(
        long id,
        [FromQuery] DateTime scheduledAt,
        [FromQuery] List<long> serviceIds,
        [FromQuery] string? excludeAppointment,
        CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(
            new CheckGarageSlotQuery { GarageId = id, ScheduledAt = scheduledAt, ServiceIds = serviceIds, ExcludeAppointment = excludeAppointment },
            cancellationToken));
    }
}
