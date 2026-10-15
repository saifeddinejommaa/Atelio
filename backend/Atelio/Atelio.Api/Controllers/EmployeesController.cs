using Atelio.Application.Features.Team.Commands;
using Atelio.Application.Features.Team.Requests;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Atelio.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly IMediator _mediator;

    public EmployeesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Ajoute un employé au garage (pour le planning) : { garageId, firstName, lastName, role, phone?, email? }. Renvoie { id }.</summary>
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddEmployeeRequest request, CancellationToken cancellationToken)
    {
        var id = await _mediator.Send(
            new AddEmployeeCommand
            {
                GarageId = request.GarageId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = request.Role,
                Phone = request.Phone,
                Email = request.Email,
            },
            cancellationToken);

        return Ok(new { id });
    }

    /// <summary>Désactive l'employé : il quitte l'équipe et le planning.</summary>
    [HttpPut("{id:long}/deactivate")]
    public async Task<IActionResult> Deactivate(long id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeactivateEmployeeCommand { EmployeeId = id }, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Remplace le planning type de l'employé. Body : { days: [{ dayOfWeek, start, end, breakStart?, breakEnd? }] }
    /// (jours travaillés uniquement, heures "08:30"). Renvoie le planning enregistré.
    /// </summary>
    [HttpPut("{id:long}/schedule")]
    public async Task<IActionResult> SaveSchedule(long id, [FromBody] SaveScheduleRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(new SaveEmployeeScheduleCommand { EmployeeId = id, Days = request.Days }, cancellationToken));
    }

    /// <summary>Déclare une absence en jours entiers : { startDate, endDate, reason, comment }.</summary>
    [HttpPost("{id:long}/absences")]
    public async Task<IActionResult> DeclareAbsence(long id, [FromBody] DeclareAbsenceRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _mediator.Send(
            new DeclareAbsenceCommand
            {
                EmployeeId = id,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Reason = request.Reason,
                Comment = request.Comment,
            },
            cancellationToken));
    }

    [HttpDelete("{id:long}/absences/{absenceId:long}")]
    public async Task<IActionResult> DeleteAbsence(long id, long absenceId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteAbsenceCommand { EmployeeId = id, AbsenceId = absenceId }, cancellationToken);

        return NoContent();
    }
}
