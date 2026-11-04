using Atelio.Application.Features.QuoteRequests.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

/// <summary>Demandes de devis des clients, traitées par le garage.</summary>
[ApiController]
[Route("api/quote-requests")]
public class QuoteRequestsController : ControllerBase
{
    private readonly IQuoteRequestQueryRepository _queryRepository;

    public QuoteRequestsController(IQuoteRequestQueryRepository queryRepository)
    {
        _queryRepository = queryRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetAllAsync(cancellationToken));
    }

    /// <summary>Nombre de demandes à traiter : { count }.</summary>
    [HttpGet("pending-count")]
    public async Task<IActionResult> GetPendingCount(CancellationToken cancellationToken)
    {
        return Ok(new { count = await _queryRepository.CountPendingAsync(cancellationToken) });
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id, CancellationToken cancellationToken)
    {
        var request = await _queryRepository.GetByIdAsync(id, cancellationToken);

        return request is null ? NotFound() : Ok(request);
    }
}
