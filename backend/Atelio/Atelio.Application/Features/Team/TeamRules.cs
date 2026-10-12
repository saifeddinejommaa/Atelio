using Atelio.Application.Features.Team.Responses;
using Atelio.Domain.Entities;

namespace Atelio.Application.Features.Team;

/// <summary>
/// Passage entre la journée type affichée (arrivée, pause, départ) et les plages enregistrées
/// (une plage sans pause, deux plages avec), et entre absences en jours et périodes UTC.
/// </summary>
internal static class TeamRules
{
    public static string Format(TimeOnly time) => time.ToString("HH:mm");

    /// <summary>
    /// Plages d'un employé => journées types (première arrivée, pause entre les deux premières plages, dernier départ).
    /// Les plages qui se chevauchent (saisies directement en base) sont d'abord fusionnées.
    /// </summary>
    public static IReadOnlyList<DayScheduleResponse> ToDays(IEnumerable<EmployeeSchedule> ranges) =>
        ranges
            .GroupBy(r => r.DayOfWeek)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var day = Merge(g.Select(r => (r.StartTime, r.EndTime)));
                return new DayScheduleResponse
                {
                    DayOfWeek = g.Key,
                    Start = Format(day[0].Start),
                    End = Format(day[^1].End),
                    BreakStart = day.Count > 1 ? Format(day[0].End) : null,
                    BreakEnd = day.Count > 1 ? Format(day[1].Start) : null,
                };
            })
            .ToList();

    /// <summary>Plages triées, celles qui se chevauchent ou se touchent étant fusionnées.</summary>
    private static List<(TimeOnly Start, TimeOnly End)> Merge(IEnumerable<(TimeOnly Start, TimeOnly End)> ranges)
    {
        var merged = new List<(TimeOnly Start, TimeOnly End)>();
        foreach (var range in ranges.OrderBy(r => r.Start))
        {
            if (merged.Count > 0 && range.Start <= merged[^1].End)
            {
                merged[^1] = (merged[^1].Start, range.End > merged[^1].End ? range.End : merged[^1].End);
            }
            else
            {
                merged.Add(range);
            }
        }

        return merged;
    }

    /// <summary>Journée type => plages à enregistrer.</summary>
    public static IEnumerable<(TimeOnly Start, TimeOnly End)> ToRanges(TimeOnly start, TimeOnly end, TimeOnly? breakStart, TimeOnly? breakEnd)
    {
        if (breakStart is TimeOnly pauseStart && breakEnd is TimeOnly pauseEnd)
        {
            yield return (start, pauseStart);
            yield return (pauseEnd, end);
        }
        else
        {
            yield return (start, end);
        }
    }

    /// <summary>Absence (UTC) => jours locaux, dernier jour inclus.</summary>
    public static AbsenceResponse ToResponse(EmployeeAbsence absence, TimeZoneInfo timeZone) => new()
    {
        Id = absence.Id,
        StartDate = LocalDay(absence.StartAt, timeZone).ToString("yyyy-MM-dd"),
        EndDate = LocalDay(absence.EndAt.AddTicks(-1), timeZone).ToString("yyyy-MM-dd"),
        Reason = absence.Reason,
        Comment = absence.Comment,
    };

    /// <summary>Début (inclus) d'un jour local, en UTC.</summary>
    public static DateTime DayStartUtc(DateOnly day, TimeZoneInfo timeZone) =>
        TimeZoneInfo.ConvertTimeToUtc(day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified), timeZone);

    private static DateOnly LocalDay(DateTime utc, TimeZoneInfo timeZone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), timeZone));
}
