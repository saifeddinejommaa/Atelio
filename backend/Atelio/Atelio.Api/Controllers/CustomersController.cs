using Atelio.Application.Features.Customers.Commands;
using Atelio.Application.Features.Customers.Responses;
using Atelio.Application.Features.Vehicles.Responses;
using Atelio.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IMediator _mediator;

    public CustomersController(
        ICustomerRepository customerRepository,
        IVehicleRepository vehicleRepository,
        IMediator mediator)
    {
        _customerRepository = customerRepository;
        _vehicleRepository = vehicleRepository;
        _mediator = mediator;
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(id, cancellationToken);

        return customer is null ? NotFound() : Ok(CustomerResponse.From(customer));
    }

    /// <summary>Recherche d'un client par e-mail (ex. après connexion).</summary>
    [HttpGet("by-email")]
    public async Task<IActionResult> GetByEmail([FromQuery] string email, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByEmailAsync(email, cancellationToken);

        return customer is null ? NotFound() : Ok(CustomerResponse.From(customer));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerCommand command, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(command, cancellationToken));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateCustomerCommand command, CancellationToken cancellationToken)
    {
        command.Id = id;

        return Ok(await _mediator.Send(command, cancellationToken));
    }

    /// <summary>Véhicules du client.</summary>
    [HttpGet("{id:long}/vehicles")]
    public async Task<IActionResult> GetVehicles(long id, CancellationToken cancellationToken)
    {
        var vehicles = await _vehicleRepository.GetActiveByCustomerAsync(id, cancellationToken);

        return Ok(vehicles.Select(VehicleResponse.From));
    }
}
