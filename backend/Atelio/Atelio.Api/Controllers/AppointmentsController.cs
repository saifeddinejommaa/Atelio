using Atelio.Application.Features.Appointments.Commands;
using Atelio.Application.Features.Appointments.Repositories;
using Atelio.Application.Features.Appointments.Requests;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public AppointmentsController(IAppointmentQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AppointmentsRequestFilter filter, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetAppointmentsAsync(filter, cancellationToken));
    }

    [HttpGet("{reference}")]
    public async Task<IActionResult> GetByReference(string reference, CancellationToken cancellationToken)
    {
        var result = await _queryRepository.GetByReferenceAsync(reference, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Prend un rendez-vous. Vérifie que le garage réalise les services et qu'un
    /// mécanicien est disponible sur toute la durée estimée.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentCommand command, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(command, cancellationToken));
    }

    [HttpPost("{reference}/cancel")]
    public async Task<IActionResult> Cancel(string reference, [FromBody] CancelAppointmentRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new CancelAppointmentCommand { Reference = reference, CustomerId = request.CustomerId },
            cancellationToken);

        return NoContent();
    }
}
