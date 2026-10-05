using Atelio.Application.Features.Invoices.Commands;
using Atelio.Application.Features.Invoices.Repositories;
using Atelio.Application.Features.Invoices.Requests;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public InvoicesController(IInvoiceQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await _queryRepository.GetByIdAsync(id, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Encaisse le montant total (un seul paiement) : { method: card | cash | transfer | check }.</summary>
    [HttpPost("{id:long}/pay")]
    public async Task<IActionResult> Pay(long id, [FromBody] PayInvoiceRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(new PayInvoiceCommand { InvoiceId = id, Method = request.Method }, cancellationToken);

        return NoContent();
    }
}
