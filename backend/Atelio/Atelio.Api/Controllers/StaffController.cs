using Atelio.Api.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

/// <summary>Personnel connecté au back-office (compte Microsoft relié à un employé de la marque).</summary>
[ApiController]
[Route("api/staff")]
[Authorize(Policy = StaffAuth.Policy)]
public class StaffController : ControllerBase
{
    /// <summary>
    /// Personnel connecté : identité, rôle d'application (Admin ou Staff) et garage de sa fiche employé.
    /// 403 si le compte n'a pas de rôle Atelio ou n'est relié à aucun employé actif de la marque.
    /// </summary>
    [HttpGet("me")]
    public IActionResult Me()
    {
        var employee = HttpContext.CurrentEmployee()!;

        return Ok(new
        {
            employeeId = employee.Id,
            employee.FirstName,
            employee.LastName,
            employee.Email,
            Role = HttpContext.CurrentRole(),
            employee.GarageId,
        });
    }
}
