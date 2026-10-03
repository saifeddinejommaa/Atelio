using Atelio.Application.Features.Garages.Queries;
using Atelio.Application.Features.Garages.Repositories;
using Atelio.Application.Features.Garages.Requests;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GaragesController : ControllerBase
{
    private readonly IGarageQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public GaragesController(IGarageQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
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
}
