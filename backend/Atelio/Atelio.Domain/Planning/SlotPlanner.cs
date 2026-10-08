using Atelio.Domain.Entities;

namespace Atelio.Domain.Planning;

/// <summary>Période [Start, End[ en UTC.</summary>
public readonly record struct Period(DateTime Start, DateTime End)
{
    public bool Overlaps(DateTime start, DateTime end) => Start < end && start < End;
}

/// <summary>Plage de travail du planning type (1 = lundi ... 7 = dimanche, heure locale).</summary>
public record ScheduleRange(int DayOfWeek, TimeOnly Start, TimeOnly End);

/// <summary>Un mécanicien : son planning type et ses absences (UTC).</summary>
public record Mechanic(long EmployeeId, IReadOnlyList<ScheduleRange> Schedule, IReadOnlyList<Period> Absences);

/// <summary>
/// Travail déjà prévu : rendez-vous ouvert, ou intervention en cours.
/// WorkMinutes : durée de travail (somme des prestations), hors pauses.
/// EmployeeId : mécanicien imposé (intervention déjà affectée), sinon null.
/// </summary>
public record PlannedJob(long? AppointmentId, DateTime StartUtc, int WorkMinutes, long? EmployeeId);

/// <summary>Places sur une période [Start, End[ (UTC) : Free mécaniciens libres sur Total en poste.</summary>
public record CapacityPeriod(DateTime Start, DateTime End, int Free, int Total);

/// <summary>Créneau proposé au client, en heure locale du garage.</summary>
public record Slot(DateTime LocalStart, DateTime StartUtc, DateTime EndUtc, bool Available);

/// <summary>Résultat du placement d'un rendez-vous : fin estimée et mécanicien pressenti, ou raison du refus.</summary>
public record Placement(bool Available, string? Reason, DateTime? EndUtc, long? EmployeeId);

/// <summary>
/// Place les rendez-vous en simulant leur répartition entre les mécaniciens, jour par jour :
/// - un mécanicien travaille selon son planning type (plages du jour), moins ses absences,
///   et dans les heures d'ouverture du garage ;
/// - un travail commence quand le mécanicien est en poste, s'arrête pendant ses pauses et
///   reprend ensuite ; il doit finir le jour même ;
/// - les travaux déjà prévus sont placés dans l'ordre de leur début, chacun chez le mécanicien
///   possible le moins chargé de la journée (une intervention affectée reste chez son mécanicien).
/// Rien n'est enregistré : l'affectation réelle se fait dans l'intervention.
/// </summary>
public class SlotPlanner
{
    public const int StepMinutes = 30;

    /// <summary>Délai minimal entre maintenant et le début d'un rendez-vous (réservation ou déplacement).</summary>
    public const int MinLeadMinutes = 180;

    private readonly Garage _garage;
    private readonly TimeZoneInfo _timeZone;
    private readonly IReadOnlyList<Mechanic> _mechanics;
    private readonly IReadOnlyList<PlannedJob> _jobs;
    private readonly Dictionary<DateOnly, DayPlan> _days = [];

    public SlotPlanner(Garage garage, TimeZoneInfo timeZone, IReadOnlyList<Mechanic> mechanics, IReadOnlyList<PlannedJob> jobs)
    {
        _garage = garage;
        _timeZone = timeZone;
        _mechanics = mechanics;
        _jobs = jobs;
    }

    /// <summary>
    /// Peut-on commencer un travail de workMinutes à cette heure locale ?
    /// Donne la fin estimée (pauses comprises) et le mécanicien le moins chargé qui peut le faire.
    /// </summary>
    public Placement TryPlace(DateTime localStart, int workMinutes, DateTime nowUtc)
    {
        var day = DateOnly.FromDateTime(localStart);
        var time = TimeOnly.FromDateTime(localStart);
        if (!_garage.IsOpenOn(day.DayOfWeek) || time < _garage.OpeningTime || time >= _garage.ClosingTime)
        {
            return Refused($"Le garage est fermé à ce moment-là (ouvert de {_garage.OpeningTime:HH\\:mm} à {_garage.ClosingTime:HH\\:mm}).");
        }

        var startUtc = ToUtc(localStart);
        if (startUtc < nowUtc.AddMinutes(MinLeadMinutes))
        {
            return Refused($"Un rendez-vous se prend au moins {MinLeadMinutes / 60} h à l'avance.");
        }

        var plan = Plan(day);
        var best = plan.FindMechanic(startUtc, workMinutes);
        return best is null
            ? Refused("Aucun mécanicien n'est disponible à cette heure pour tout le travail (pauses comprises, fin le jour même).")
            : new Placement(true, null, best.Value.Segments[^1].End, best.Value.EmployeeId);
    }

    /// <summary>
    /// Lancement d'un travail à cette heure locale (le client est là) : premier mécanicien libre
    /// pour tout le travail, pauses comprises, fin le jour même. Pas de contrôle « créneau passé ».
    /// </summary>
    public Placement TryStart(DateTime localStart, int workMinutes)
    {
        var first = Plan(DateOnly.FromDateTime(localStart)).FindMechanic(ToUtc(localStart), workMinutes, firstFree: true);
        return first is null
            ? Refused("Aucun mécanicien n'est libre à cette heure pour tout le travail (pauses comprises, fin le jour même).")
            : new Placement(true, null, first.Value.Segments[^1].End, first.Value.EmployeeId);
    }

    /// <summary>Créneaux d'une journée pour un travail donné. latestStart : heure de début maximale (ex. 12:00).</summary>
    public IReadOnlyList<Slot> GetSlots(DateOnly day, int workMinutes, DateTime nowUtc, TimeOnly? latestStart = null)
    {
        var slots = new List<Slot>();
        if (!_garage.IsOpenOn(day.DayOfWeek))
        {
            return slots;
        }

        var closing = day.ToDateTime(_garage.ClosingTime);
        for (var localStart = day.ToDateTime(_garage.OpeningTime); localStart < closing; localStart = localStart.AddMinutes(StepMinutes))
        {
            if (latestStart is TimeOnly latest && TimeOnly.FromDateTime(localStart) >= latest)
            {
                break;
            }

            var placement = TryPlace(localStart, workMinutes, nowUtc);
            var startUtc = ToUtc(localStart);
            slots.Add(new Slot(localStart, startUtc, placement.EndUtc ?? startUtc.AddMinutes(workMinutes), placement.Available));
        }

        return slots;
    }

    /// <summary>
    /// Places d'une journée, par tranches de StepMinutes : mécaniciens en poste sur toute la tranche (Total),
    /// dont libres dans la répartition simulée (Free). Les tranches consécutives identiques sont fusionnées.
    /// </summary>
    public IReadOnlyList<CapacityPeriod> GetCapacity(DateOnly day)
    {
        var periods = new List<CapacityPeriod>();
        if (!_garage.IsOpenOn(day.DayOfWeek))
        {
            return periods;
        }

        var plan = Plan(day);
        var closing = day.ToDateTime(_garage.ClosingTime);
        for (var localStart = day.ToDateTime(_garage.OpeningTime); localStart < closing; localStart = localStart.AddMinutes(StepMinutes))
        {
            var startUtc = ToUtc(localStart);
            var localEnd = localStart.AddMinutes(StepMinutes) < closing ? localStart.AddMinutes(StepMinutes) : closing;
            var endUtc = ToUtc(localEnd);
            var (free, total) = plan.Count(startUtc, endUtc);

            if (periods.Count > 0 && periods[^1].End == startUtc && periods[^1].Free == free && periods[^1].Total == total)
            {
                periods[^1] = periods[^1] with { End = endUtc };
            }
            else
            {
                periods.Add(new CapacityPeriod(startUtc, endUtc, free, total));
            }
        }

        return periods;
    }

    /// <summary>Mécanicien pressenti pour un rendez-vous déjà prévu (répartition simulée), ou null.</summary>
    public long? GetAssignedEmployee(long appointmentId, DateOnly day) =>
        Plan(day).Assignments.TryGetValue(appointmentId, out var employeeId) ? employeeId : null;

    public DateTime ToUtc(DateTime local) =>
        TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), _timeZone);

    private static Placement Refused(string reason) => new(false, reason, null, null);

    /// <summary>Répartition simulée d'une journée, calculée une seule fois.</summary>
    private DayPlan Plan(DateOnly day)
    {
        if (_days.TryGetValue(day, out var plan))
        {
            return plan;
        }

        plan = new DayPlan(_mechanics.Select(m => new MechanicDay(m.EmployeeId, WorkPeriods(m, day))).ToList());

        var dayStart = ToUtc(day.ToDateTime(TimeOnly.MinValue));
        var dayEnd = ToUtc(day.AddDays(1).ToDateTime(TimeOnly.MinValue));
        foreach (var job in _jobs.Where(j => j.StartUtc >= dayStart && j.StartUtc < dayEnd).OrderBy(j => j.StartUtc))
        {
            plan.Place(job);
        }

        _days[day] = plan;
        return plan;
    }

    /// <summary>Plages de travail du jour (UTC), dans les heures d'ouverture, absences retirées.</summary>
    private List<Period> WorkPeriods(Mechanic mechanic, DateOnly day)
    {
        var dayOfWeek = day.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)day.DayOfWeek;
        var periods = new List<Period>();

        foreach (var range in mechanic.Schedule.Where(r => r.DayOfWeek == dayOfWeek).OrderBy(r => r.Start))
        {
            var start = range.Start > _garage.OpeningTime ? range.Start : _garage.OpeningTime;
            var end = range.End < _garage.ClosingTime ? range.End : _garage.ClosingTime;
            if (end > start)
            {
                periods.Add(new Period(ToUtc(day.ToDateTime(start)), ToUtc(day.ToDateTime(end))));
            }
        }

        // Plages qui se chevauchent (saisies directement en base) : fusionnées.
        var merged = new List<Period>();
        foreach (var period in periods.OrderBy(p => p.Start))
        {
            if (merged.Count > 0 && period.Start <= merged[^1].End)
            {
                merged[^1] = merged[^1] with { End = period.End > merged[^1].End ? period.End : merged[^1].End };
            }
            else
            {
                merged.Add(period);
            }
        }

        foreach (var absence in mechanic.Absences)
        {
            merged = merged.SelectMany(p => Subtract(p, absence)).ToList();
        }

        return merged;
    }

    private static IEnumerable<Period> Subtract(Period period, Period removed)
    {
        if (!period.Overlaps(removed.Start, removed.End))
        {
            yield return period;
            yield break;
        }

        if (removed.Start > period.Start)
        {
            yield return new Period(period.Start, removed.Start);
        }

        if (removed.End < period.End)
        {
            yield return new Period(removed.End, period.End);
        }
    }

    /// <summary>Un mécanicien sur une journée : ses plages de travail, ses morceaux de travail déjà prévus.</summary>
    private sealed class MechanicDay(long employeeId, List<Period> work)
    {
        public long EmployeeId { get; } = employeeId;

        public List<Period> Work { get; } = work;

        public List<Period> Busy { get; } = [];

        public double LoadMinutes => Busy.Sum(b => (b.End - b.Start).TotalMinutes);

        /// <summary>
        /// Morceaux de travail si le mécanicien commence à startUtc : il doit être en poste et libre à cette heure,
        /// le travail saute ses pauses et doit finir dans ses plages du jour, sans chevaucher un autre travail.
        /// </summary>
        public List<Period>? Schedule(DateTime startUtc, int workMinutes)
        {
            var first = Work.FindIndex(p => p.Start <= startUtc && startUtc < p.End);
            if (first < 0)
            {
                return null;
            }

            var segments = new List<Period>();
            var remaining = TimeSpan.FromMinutes(workMinutes);
            for (var i = first; i < Work.Count && remaining > TimeSpan.Zero; i++)
            {
                var segmentStart = i == first ? startUtc : Work[i].Start;
                var segmentEnd = segmentStart + remaining < Work[i].End ? segmentStart + remaining : Work[i].End;
                if (Busy.Any(b => b.Overlaps(segmentStart, segmentEnd)))
                {
                    return null;
                }

                segments.Add(new Period(segmentStart, segmentEnd));
                remaining -= segmentEnd - segmentStart;
            }

            return remaining > TimeSpan.Zero ? null : segments;
        }

        public bool WorksDuring(DateTime start, DateTime end) => Work.Any(p => p.Start <= start && end <= p.End);

        public bool BusyDuring(DateTime start, DateTime end) => Busy.Any(b => b.Overlaps(start, end));
    }

    private sealed class DayPlan(List<MechanicDay> mechanics)
    {
        public Dictionary<long, long> Assignments { get; } = [];

        /// <summary>
        /// Mécanicien possible avec ses morceaux de travail : le moins chargé (puis le plus petit identifiant),
        /// ou le premier libre (plus petit identifiant) si firstFree.
        /// </summary>
        public (long EmployeeId, List<Period> Segments)? FindMechanic(DateTime startUtc, int workMinutes, bool firstFree = false)
        {
            (long EmployeeId, List<Period> Segments)? best = null;
            double bestLoad = double.MaxValue;
            foreach (var mechanic in mechanics.OrderBy(m => m.EmployeeId))
            {
                var segments = mechanic.Schedule(startUtc, workMinutes);
                if (segments is not null && firstFree)
                {
                    return (mechanic.EmployeeId, segments);
                }

                if (segments is not null && mechanic.LoadMinutes < bestLoad)
                {
                    best = (mechanic.EmployeeId, segments);
                    bestLoad = mechanic.LoadMinutes;
                }
            }

            return best;
        }

        public void Place(PlannedJob job)
        {
            // Intervention déjà affectée : elle reste chez son mécanicien.
            var assigned = job.EmployeeId is long id ? mechanics.FirstOrDefault(m => m.EmployeeId == id) : null;
            if (assigned is not null)
            {
                var segments = assigned.Schedule(job.StartUtc, job.WorkMinutes)
                    ?? [new Period(job.StartUtc, job.StartUtc.AddMinutes(job.WorkMinutes))];
                assigned.Busy.AddRange(segments);
                return;
            }

            // Sinon, le moins chargé de ceux qui peuvent le faire. Un travail impossible à placer
            // (pris avant un changement de planning, par exemple) est ignoré.
            var best = FindMechanic(job.StartUtc, job.WorkMinutes);
            if (best is null)
            {
                return;
            }

            mechanics.First(m => m.EmployeeId == best.Value.EmployeeId).Busy.AddRange(best.Value.Segments);
            if (job.AppointmentId is long appointmentId)
            {
                Assignments[appointmentId] = best.Value.EmployeeId;
            }
        }

        /// <summary>(libres, en poste) sur [start, end[.</summary>
        public (int Free, int Total) Count(DateTime start, DateTime end)
        {
            var working = mechanics.Where(m => m.WorksDuring(start, end)).ToList();
            return (working.Count(m => !m.BusyDuring(start, end)), working.Count);
        }
    }
}
