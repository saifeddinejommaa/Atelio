using Atelio.Api.Middleware;
using Atelio.Application.Common;
using Atelio.Application.Features.Appointments.Commands;
using Atelio.Application.Features.Appointments.Repositories;
using Atelio.Application.Features.Appointments.Requests;
using Atelio.Application.Features.Customers.Responses;
using Atelio.Application.Features.Vehicles.Responses;
using Atelio.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace Atelio.Api.Controllers;

/// <summary>
/// Compte du client connecté (site b2c) : le client vient du jeton (Authorization: Bearer),
/// jamais de la requête. Le jeton n'est valable que pour la marque qui l'a émis.
/// </summary>
[ApiController]
[Route("api/me")]
[Authorize(Policy = CustomerAuthPolicy.Name)]
public class MeController : ControllerBase
{
    private readonly ICustomerRepository _customers;
    private readonly IVehicleRepository _vehicles;
    private readonly IAppointmentQueryRepository _appointments;
    private readonly IMediator _mediator;

    public MeController(
        ICustomerRepository customers,
        IVehicleRepository vehicles,
        IAppointmentQueryRepository appointments,
        IMediator mediator)
    {
        _customers = customers;
        _vehicles = vehicles;
        _appointments = appointments;
        _mediator = mediator;
    }

    private long CustomerId => long.Parse(User.FindFirst(CustomerClaims.CustomerId)!.Value, CultureInfo.InvariantCulture);

    /// <summary>Profil du client. 401 si le compte n'existe plus ou est désactivé.</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var customer = await _customers.GetByIdAsync(CustomerId, cancellationToken);

        return customer is { IsActive: true } ? Ok(CustomerResponse.From(customer)) : Unauthorized();
    }

    [HttpGet("vehicles")]
    public async Task<IActionResult> GetVehicles(CancellationToken cancellationToken)
    {
        var vehicles = await _vehicles.GetActiveByCustomerAsync(CustomerId, cancellationToken);

        return Ok(vehicles.Select(VehicleResponse.From));
    }

    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments(CancellationToken cancellationToken)
    {
        return Ok(await _appointments.GetAppointmentsAsync(new AppointmentsRequestFilter { CustomerId = CustomerId }, cancellationToken));
    }

    /// <summary>Prend un rendez-vous pour le client connecté (même corps que POST /api/appointments, sans customerId).</summary>
    [HttpPost("appointments")]
    public async Task<IActionResult> Book([FromBody] CreateAppointmentCommand command, CancellationToken cancellationToken)
    {
        command.CustomerId = CustomerId;

        return Ok(await _mediator.Send(command, cancellationToken));
    }

    [HttpPost("appointments/{reference}/cancel")]
    public async Task<IActionResult> Cancel(string reference, CancellationToken cancellationToken)
    {
        await _mediator.Send(new CancelAppointmentCommand { Reference = reference, CustomerId = CustomerId }, cancellationToken);

        return NoContent();
    }
}
