using Atelio.Application.Features.Articles.Requests;
using Atelio.Application.Features.Promotions.Commands;
using Atelio.Application.Features.Promotions.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionQueryRepository _queryRepository;
    private readonly IMediator _mediator;

    public PromotionsController(IPromotionQueryRepository queryRepository, IMediator mediator)
    {
        _queryRepository = queryRepository;
        _mediator = mediator;
    }

    /// <summary>Promotions affichées aujourd'hui sur le site (page « Offres du moment »).</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetActivePromotionsAsync(cancellationToken));
    }

    /// <summary>Toutes les promotions (back-office), y compris à venir, terminées et désactivées.</summary>
    [HttpGet("all")]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetAllAsync(cancellationToken));
    }

    /// <summary>
    /// Ajoute une promotion : { serviceId, title, description?, discountPercent, startsOn, endsOn?, conditions? }. Renvoie { id }.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PromotionInput request, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(
            new CreatePromotionCommand
            {
                ServiceId = request.ServiceId,
                Title = request.Title,
                Description = request.Description,
                DiscountPercent = request.DiscountPercent,
                StartsOn = request.StartsOn,
                EndsOn = request.EndsOn,
                Conditions = request.Conditions,
            },
            cancellationToken);

        return Ok(new { id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] PromotionInput request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new UpdatePromotionCommand
            {
                PromotionId = id,
                ServiceId = request.ServiceId,
                Title = request.Title,
                Description = request.Description,
                DiscountPercent = request.DiscountPercent,
                StartsOn = request.StartsOn,
                EndsOn = request.EndsOn,
                Conditions = request.Conditions,
            },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Active ou désactive la promotion : { isActive }.</summary>
    [HttpPut("{id:long}/active")]
    public async Task<IActionResult> SetActive(long id, [FromBody] SetArticleActiveRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(new SetPromotionActiveCommand { PromotionId = id, IsActive = request.IsActive }, cancellationToken);

        return NoContent();
    }
}
