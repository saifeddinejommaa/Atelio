using Atelio.Application.Features.Appointments.Commands;
using Atelio.Application.Features.Appointments.Queries;
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

    /// <summary>Garage : déplace le rendez-vous (même durée), si un mécanicien est disponible.</summary>
    [HttpPost("{reference}/reschedule")]
    public async Task<IActionResult> Reschedule(string reference, [FromBody] RescheduleAppointmentRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new RescheduleAppointmentCommand { Reference = reference, ScheduledAt = request.ScheduledAt },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Garage : abandonne le rendez-vous, annulé ("cancelled") ou client non venu ("no_show").</summary>
    [HttpPost("{reference}/abandon")]
    public async Task<IActionResult> Abandon(string reference, [FromBody] AbandonAppointmentRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new AbandonAppointmentCommand { Reference = reference, Status = request.Status },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Garage : le client est là, ouvre l'intervention. Renvoie { interventionId }.</summary>
    [HttpPost("{reference}/start")]
    public async Task<IActionResult> Start(string reference, [FromBody] StartAppointmentRequest? request, CancellationToken cancellationToken)
    {
        var interventionId = await _mediator.Send(
            new StartAppointmentCommand { Reference = reference, StartAt = request?.StartAt },
            cancellationToken);

        return Ok(new { interventionId });
    }

    /// <summary>
    /// Garage : avant de lancer à cette heure (heure locale, par défaut maintenant), premier mécanicien libre
    /// et fin estimée. Non bloquant : le lancement reste possible si personne n'est libre.
    /// </summary>
    [HttpGet("{reference}/start-check")]
    public async Task<IActionResult> StartCheck(string reference, [FromQuery] DateTime? startAt, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(new GetAppointmentStartCheckQuery { Reference = reference, StartAt = startAt }, cancellationToken));
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
