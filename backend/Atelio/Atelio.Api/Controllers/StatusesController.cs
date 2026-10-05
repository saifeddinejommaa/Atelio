using Atelio.Application.Features.Statuses.Responses;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

/// <summary>Tables de statuts (id, libellé, actif), ex. pour les filtres du back-office.</summary>
[ApiController]
[Route("api/statuses")]
public class StatusesController : ControllerBase
{
    private readonly IStatusRepository _statuses;

    public StatusesController(IStatusRepository statuses)
    {
        _statuses = statuses;
    }

    [HttpGet("appointments")]
    public Task<IActionResult> GetAppointmentStatuses(CancellationToken cancellationToken) =>
        GetAll<AppointmentStatusLookup>(cancellationToken);

    [HttpGet("interventions")]
    public Task<IActionResult> GetInterventionStatuses(CancellationToken cancellationToken) =>
        GetAll<InterventionStatusLookup>(cancellationToken);

    [HttpGet("invoices")]
    public Task<IActionResult> GetInvoiceStatuses(CancellationToken cancellationToken) =>
        GetAll<InvoiceStatusLookup>(cancellationToken);

    [HttpGet("payments")]
    public Task<IActionResult> GetPaymentStatuses(CancellationToken cancellationToken) =>
        GetAll<PaymentStatusLookup>(cancellationToken);

    private async Task<IActionResult> GetAll<TStatus>(CancellationToken cancellationToken)
        where TStatus : StatusLookup
    {
        var statuses = await _statuses.GetAllAsync<TStatus>(cancellationToken);

        return Ok(statuses.Select(StatusResponse.From));
    }
}
