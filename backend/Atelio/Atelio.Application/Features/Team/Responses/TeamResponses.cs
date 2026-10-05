using Atelio.Domain.Enums;

namespace Atelio.Application.Features.Team.Responses;

/// <summary>Employé avec son planning type et ses absences sur la période demandée.</summary>
public class TeamMemberResponse
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    // mechanic, manager, reception
    public EmployeeRole Role { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    // Jours travaillés uniquement.
    public IReadOnlyList<DayScheduleResponse> Schedule { get; set; } = [];

    public IReadOnlyList<AbsenceResponse> Absences { get; set; } = [];
}

/// <summary>Journée type : arrivée, pause (facultative) et départ, heure locale "08:30".</summary>
public class DayScheduleResponse
{
    // 1 = lundi ... 7 = dimanche.
    public int DayOfWeek { get; set; }

    public string Start { get; set; } = null!;

    public string End { get; set; } = null!;

    public string? BreakStart { get; set; }

    public string? BreakEnd { get; set; }
}

/// <summary>Absence en jours entiers (heure locale), premier et dernier jour inclus.</summary>
public class AbsenceResponse
{
    public long Id { get; set; }

    // "2026-10-12"
    public string StartDate { get; set; } = null!;

    public string EndDate { get; set; } = null!;

    // leave, sick, training, other
    public AbsenceReason Reason { get; set; }

    public string? Comment { get; set; }
}
