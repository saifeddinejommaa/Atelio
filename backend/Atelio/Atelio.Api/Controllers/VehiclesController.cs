using Atelio.Application.Features.Vehicles.Commands;
using Atelio.Application.Features.Vehicles.Responses;
using Atelio.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IMediator _mediator;

    public VehiclesController(IVehicleRepository vehicleRepository, IMediator mediator)
    {
        _vehicleRepository = vehicleRepository;
        _mediator = mediator;
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, cancellationToken);

        return vehicle is null ? NotFound() : Ok(VehicleResponse.From(vehicle));
    }

    /// <summary>Ajoute un véhicule au client, ou met à jour celui qui a la même immatriculation.</summary>
    [HttpPost]
    public async Task<IActionResult> Save([FromBody] SaveVehicleCommand command, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(command, cancellationToken));
    }
}
