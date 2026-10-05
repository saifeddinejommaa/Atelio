using Atelio.Application.Features.Team.Commands;

namespace Atelio.Application.Features.Team.Requests;

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
