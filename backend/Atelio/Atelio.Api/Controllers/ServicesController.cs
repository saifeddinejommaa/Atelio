using Atelio.Application.Features.Services.Repositories;
using Atelio.Application.Features.Services.Requests;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceQueryRepository _queryRepository;

    public ServicesController(IServiceQueryRepository queryRepository)
    {
        _queryRepository = queryRepository;
    }

    /// <summary>Services actifs (optionnellement ceux d'un garage), avec leur prix « à partir de ».</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ServicesRequestFilter filter, CancellationToken cancellationToken)
    {
        return Ok(await _queryRepository.GetServicesAsync(filter, cancellationToken));
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken cancellationToken)
    {
        var result = await _queryRepository.GetByCodeAsync(code, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }
}
