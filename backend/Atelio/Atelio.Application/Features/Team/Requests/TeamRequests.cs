using Atelio.Application.Features.Team.Commands;
using Atelio.Domain.Enums;

namespace Atelio.Application.Features.Team.Requests;

/// <summary>Nouvel employé : { garageId, firstName, lastName, role, phone?, email? }.</summary>
public class AddEmployeeRequest
{
    public long GarageId { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    // mechanic, manager, reception
    public EmployeeRole Role { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }
}

public class SaveScheduleRequest
{
    // Jours travaillés ; un jour absent de la liste est un jour de repos.
    public List<DayScheduleInput> Days { get; set; } = [];
}

public class DeclareAbsenceRequest
{
    // Premier et dernier jour inclus, ex. "2026-10-12".
    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    // leave, sick, training, other
    public string Reason { get; set; } = "leave";

    public string? Comment { get; set; }
}
