using Atelio.Application.Features.Promotions.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PromotionsController : ControllerBase
{
    private readonly IPromotionQueryRepository _queryRepository;

    public PromotionsController(IPromotionQueryRepository queryRepository)
    {
        _queryRepository = queryRepository;
    }

    /// <summary>Promotions actives (page « Offres du moment »).</summary>
    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetActivePromotionsAsync(cancellationToken));
    }
}
