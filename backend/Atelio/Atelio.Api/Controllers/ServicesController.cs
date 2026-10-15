using Atelio.Application.Features.Articles.Requests;
using Atelio.Application.Features.Services.Commands;
using Atelio.Application.Features.Services.Repositories;
using Atelio.Application.Features.Services.Requests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public ServicesController(IServiceQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    /// <summary>Services actifs (optionnellement ceux d'un garage), avec leur prix « à partir de ».</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] ServicesRequestFilter filter, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetServicesAsync(filter, cancellationToken));
    }

    /// <summary>Toutes les prestations, actives ou non (back-office).</summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAllForStaff(CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetAllAsync(cancellationToken));
    }

    [HttpGet("{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken)
    {
        var result = await _queryRepository.GetByCodeAsync(code, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Ajoute une prestation : { name, description?, price, durationMinutes, categoryId?, uncertainDuration }. Renvoie { id }.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ServiceInput request, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(
            new CreateServiceCommand
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                DurationMinutes = request.DurationMinutes,
                CategoryId = request.CategoryId,
                UncertainDuration = request.UncertainDuration,
            },
            cancellationToken);

        return Ok(new { id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] ServiceInput request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new UpdateServiceCommand
            {
                ServiceId = id,
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                DurationMinutes = request.DurationMinutes,
                CategoryId = request.CategoryId,
                UncertainDuration = request.UncertainDuration,
            },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Active ou désactive la prestation : { isActive }. Désactivée, elle n'est plus proposée sur le site.</summary>
    [HttpPut("{id:long}/active")]
    public async Task<IActionResult> SetActive(long id, [FromBody] SetArticleActiveRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(new SetServiceActiveCommand { ServiceId = id, IsActive = request.IsActive }, cancellationToken);

        return NoContent();
    }

    /// <summary>Supprime une prestation jamais utilisée.</summary>
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteServiceCommand { ServiceId = id }, cancellationToken);

        return NoContent();
    }
}
