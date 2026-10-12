using Atelio.Application.Features.Quotes.Commands;
using Atelio.Application.Features.Quotes.Repositories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuotesController : ControllerBase
{
    private readonly IQuoteQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public QuotesController(IQuoteQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var quote = await _queryRepository.GetByIdAsync(id, cancellationToken);

        return quote is null ? NotFound() : Ok(quote);
    }

    /// <summary>
    /// Crée un devis : { customerId, vehicleId, garageId, lines: [{ articleId, quantity }] }. Renvoie { id }.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuoteCommand command, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(command, cancellationToken);

        return Ok(new { id });
    }

    /// <summary>Envoie le devis par e-mail au client.</summary>
    [HttpPost("{id:long}/send")]
    public async Task<IActionResult> Send(long id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new SendQuoteCommand { QuoteId = id }, cancellationToken);

        return NoContent();
    }
}
