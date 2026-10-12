using Atelio.Application.Features.CustomerAuth.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

/// <summary>Connexion des clients du site b2c : code à 6 chiffres envoyé par e-mail.</summary>
[ApiController]
[Route("api/auth/customer")]
public class CustomerAuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomerAuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Envoie un code à l'e-mail : { email }. Même réponse que le compte existe ou non.</summary>
    [HttpPost("code")]
    public async Task<IActionResult> RequestCode([FromBody] RequestCustomerLoginCodeCommand command, CancellationToken cancellationToken)
    {
        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Vérifie le code : { email, code }. Renvoie { token, expiresAt } (client connu)
    /// ou { signupToken } (compte à créer avec /register).
    /// </summary>
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyCustomerLoginCodeCommand command, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(command, cancellationToken));
    }

    /// <summary>Crée le compte de l'e-mail vérifié : { signupToken, firstName, lastName, phone }. Renvoie { token, expiresAt }.</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCustomerCommand command, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(command, cancellationToken));
    }
}
