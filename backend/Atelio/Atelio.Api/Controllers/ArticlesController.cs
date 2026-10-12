using Atelio.Application.Features.Articles.Commands;
using Atelio.Application.Features.Articles.Requests;
using Atelio.Application.Features.Articles.Responses;
using Atelio.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController : ControllerBase
{
    private readonly IArticleRepository _articleRepository;
    private readonly IMediator _mediator;

    public ArticlesController(IArticleRepository articleRepository, IMediator mediator)
    {
        _articleRepository = articleRepository;
        _mediator = mediator;
    }

    /// <summary>Catalogue par nom : GET /api/articles?search=huile&amp;active=true</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ArticlesRequestFilter filter, CancellationToken cancellationToken)
    {
        var articles = await _articleRepository.GetAllAsync(filter.Search, filter.Active, cancellationToken);

        return Ok(articles.Select(ArticleResponse.From));
    }

    /// <summary>Ajoute un article : { name, description?, unitPriceHt }. Renvoie { id }.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ArticleInput request, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(
            new CreateArticleCommand { Name = request.Name, Description = request.Description, UnitPriceHt = request.UnitPriceHt },
            cancellationToken);

        return Ok(new { id });
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] ArticleInput request, CancellationToken cancellationToken)
    {
        await _mediator.Send(
            new UpdateArticleCommand { ArticleId = id, Name = request.Name, Description = request.Description, UnitPriceHt = request.UnitPriceHt },
            cancellationToken);

        return NoContent();
    }

    /// <summary>Active ou désactive l'article : { isActive }.</summary>
    [HttpPut("{id:long}/active")]
    public async Task<IActionResult> SetActive(long id, [FromBody] SetArticleActiveRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(new SetArticleActiveCommand { ArticleId = id, IsActive = request.IsActive }, cancellationToken);

        return NoContent();
    }
}
