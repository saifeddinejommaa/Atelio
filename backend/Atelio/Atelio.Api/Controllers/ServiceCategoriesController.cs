using Atelio.Application.Features.Services.Responses;
using Atelio.Domain.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/service-categories")]
public class ServiceCategoriesController : ControllerBase
{
    private readonly IServiceCategoryRepository _categories;

    public ServiceCategoriesController(IServiceCategoryRepository categories)
    {
        _categories = categories;
    }

    /// <summary>Catégories de prestations avec leur taux horaire de main-d'œuvre TTC.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var categories = await _categories.GetAllAsync(cancellationToken);

        return Ok(categories.Select(ServiceCategoryResponse.From));
    }
}
