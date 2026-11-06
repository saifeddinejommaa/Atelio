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

/// <summary>
/// Résultat du placement d'un rendez-vous : fin estimée et mécanicien pressenti, ou raison du refus.
/// Warning : possible pour le garage, mais à signaler (aucun mécanicien libre sur toute la durée).
/// </summary>
public record Placement(bool Available, string? Reason, DateTime? EndUtc, long? EmployeeId, string? Warning = null);

/// <summary>
/// Place les rendez-vous en simulant leur répartition entre les mécaniciens :
/// - un mécanicien travaille selon son planning type (plages du jour), moins ses absences,
///   et dans les heures d'ouverture du garage ;
/// - un travail commence quand le mécanicien est en poste, s'arrête pendant ses pauses et hors de ses
///   journées, puis reprend à sa plage suivante : il peut donc s'étaler sur plusieurs jours ;
/// - les travaux déjà prévus sont placés dans l'ordre de leur début, chacun chez le mécanicien
///   possible le moins chargé de la journée (une intervention affectée reste chez son mécanicien) ;
/// - un travail sans mécanicien libre sur toute sa durée occupe quand même le moins chargé :
///   il prend une place au garage, pour que le site ne propose pas de créneau de trop.
/// Le client réserve un travail qui finit le jour même (TryPlace) ; le garage peut faire plus (TryPlaceForGarage).
/// Pour le garage, sans temps de travail connu (workMinutes null), rien n'est estimé ni bloqué.
/// Rien n'est enregistré : l'affectation réelle se fait dans l'intervention.
/// </summary>
public class SlotPlanner
{
    public const int StepMinutes = 30;

    /// <summary>Délai minimal entre maintenant et le début d'un rendez-vous (réservation ou déplacement).</summary>
    public const int MinLeadMinutes = 60;

    /// <summary>Tolérance du garage sur un créneau tout juste commencé (client au comptoir).</summary>
    public const int GaragePastToleranceMinutes = 5;

    /// <summary>Jours explorés au plus pour placer un travail long.</summary>
    public const int MaxPlanningDays = 60;

    private readonly Garage _garage;
    private readonly TimeZoneInfo _timeZone;
    private readonly IReadOnlyList<Mechanic> _mechanics;
    private readonly IReadOnlyList<PlannedJob> _jobs;
    private readonly Dictionary<DateOnly, DayPlan> _days = [];
    private readonly Dictionary<long, long> _assignments = [];
    private bool _jobsPlaced;

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

        var best = FindMechanic(startUtc, workMinutes, sameDay: true);
        return best is null
            ? Refused("Aucun mécanicien n'est disponible à cette heure pour tout le travail (pauses comprises, fin le jour même).")
            : new Placement(true, null, best.Value.Segments[^1].End, best.Value.EmployeeId);
    }

    /// <summary>
    /// Rendez-vous pris par le garage : le travail peut durer plusieurs jours et sans délai minimal.
    /// Sans mécanicien libre sur toute la durée, c'est possible quand même, avec un avertissement.
    /// Une heure de début complète est refusée, sauf allowFull (rendez-vous déjà posé qu'on estime sans le déplacer).
    /// </summary>
    public Placement TryPlaceForGarage(DateTime localStart, int? workMinutes, DateTime nowUtc, bool allowFull = false)
    {
        var day = DateOnly.FromDateTime(localStart);
        var time = TimeOnly.FromDateTime(localStart);
        if (!_garage.IsOpenOn(day.DayOfWeek) || time < _garage.OpeningTime || time >= _garage.ClosingTime)
        {
            return Refused($"Le garage est fermé à ce moment-là (ouvert de {_garage.OpeningTime:HH\\:mm} à {_garage.ClosingTime:HH\\:mm}).");
        }

        var startUtc = ToUtc(localStart);
        if (startUtc < nowUtc.AddMinutes(-GaragePastToleranceMinutes))
        {
            return Refused("Ce créneau est déjà passé.");
        }

        if (!allowFull && IsFull(localStart))
        {
            return Refused("Ce créneau est complet : choisissez un autre horaire.");
        }

        if (workMinutes is not int minutes)
        {
            return new Placement(true, null, null, null);
        }

        var best = FindMechanic(startUtc, minutes);
        return best is not null
            ? new Placement(true, null, best.Value.Segments[^1].End, best.Value.EmployeeId)
            : new Placement(
                true,
                null,
                EstimateEnd(startUtc, minutes),
                null,
                "Aucun mécanicien n'est libre sur toute la durée : à enregistrer sans mécanicien, à affecter plus tard.");
    }

    /// <summary>
    /// Lancement d'un travail à cette heure locale (le client est là) : premier mécanicien libre
    /// pour tout le travail, pauses comprises, sur plusieurs jours si besoin. Pas de contrôle « créneau passé ».
    /// Sans mécanicien libre, la fin estimée reste donnée avec le refus.
    /// </summary>
    public Placement TryStart(DateTime localStart, int? workMinutes)
    {
        if (workMinutes is not int minutes)
        {
            return Refused("Aucun temps n'est estimé.");
        }

        var startUtc = ToUtc(localStart);
        var first = FindMechanic(startUtc, minutes, firstFree: true);
        return first is null
            ? new Placement(false, "Aucun mécanicien n'est libre à cette heure pour tout le travail.", EstimateEnd(startUtc, minutes), null)
            : new Placement(true, null, first.Value.Segments[^1].End, first.Value.EmployeeId);
    }

    /// <summary>Créneaux d'une journée pour un travail donné.</summary>
    public IReadOnlyList<Slot> GetSlots(DateOnly day, int workMinutes, DateTime nowUtc)
    {
        var slots = new List<Slot>();
        if (!_garage.IsOpenOn(day.DayOfWeek))
        {
            return slots;
        }

        var closing = day.ToDateTime(_garage.ClosingTime);
        for (var localStart = day.ToDateTime(_garage.OpeningTime); localStart < closing; localStart = localStart.AddMinutes(StepMinutes))
        {
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

        EnsureJobsPlaced();
        var plan = Day(day);
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
    public long? GetAssignedEmployee(long appointmentId, DateOnly day)
    {
        EnsureJobsPlaced();
        return _assignments.TryGetValue(appointmentId, out var employeeId) ? employeeId : null;
    }

    /// <summary>La case du calendrier de cette heure locale est-elle complète (aucun mécanicien libre) ?</summary>
    private bool IsFull(DateTime localStart)
    {
        EnsureJobsPlaced();
        var day = DateOnly.FromDateTime(localStart);
        var opening = day.ToDateTime(_garage.OpeningTime);
        var slot = opening.AddMinutes((int)(localStart - opening).TotalMinutes / StepMinutes * StepMinutes);
        var closing = day.ToDateTime(_garage.ClosingTime);
        var end = slot.AddMinutes(StepMinutes) < closing ? slot.AddMinutes(StepMinutes) : closing;
        return Day(day).Count(ToUtc(slot), ToUtc(end)).Free == 0;
    }

    public DateTime ToUtc(DateTime local) =>
        TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), _timeZone);

    private static Placement Refused(string reason) => new(false, reason, null, null);

    private DateOnly LocalDay(DateTime utc) => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utc, _timeZone));

    /// <summary>Plages de travail des mécaniciens pour une journée, et leurs travaux prévus.</summary>
    private DayPlan Day(DateOnly day)
    {
        if (!_days.TryGetValue(day, out var plan))
        {
            plan = new DayPlan(_mechanics.Select(m => new MechanicDay(m.EmployeeId, WorkPeriods(m, day))).ToList());
            _days[day] = plan;
        }

        return plan;
    }

    /// <summary>Répartition simulée des travaux déjà prévus, calculée une seule fois.</summary>
    private void EnsureJobsPlaced()
    {
        if (_jobsPlaced)
        {
            return;
        }

        _jobsPlaced = true;
        foreach (var job in _jobs.OrderBy(j => j.StartUtc))
        {
            Place(job);
        }
    }

    private void Place(PlannedJob job)
    {
        // Intervention déjà affectée : elle reste chez son mécanicien.
        if (job.EmployeeId is long id && _mechanics.Any(m => m.EmployeeId == id))
        {
            AddBusy(id, Schedule(id, job.StartUtc, job.WorkMinutes, sameDay: false)
                ?? Schedule(id, job.StartUtc, job.WorkMinutes, sameDay: false, force: true)
                ?? [new Period(job.StartUtc, job.StartUtc.AddMinutes(job.WorkMinutes))]);
            return;
        }

        var best = FindMechanic(job.StartUtc, job.WorkMinutes);
        if (best is not null)
        {
            AddBusy(best.Value.EmployeeId, best.Value.Segments);
            if (job.AppointmentId is long appointmentId)
            {
                _assignments[appointmentId] = best.Value.EmployeeId;
            }

            return;
        }

        // Personne de libre sur toute la durée : le travail occupe quand même une place au garage.
        if (ForcedSegments(job.StartUtc, job.WorkMinutes) is { } forced)
        {
            AddBusy(forced.EmployeeId, forced.Segments);
        }
    }

    private void AddBusy(long employeeId, List<Period> segments)
    {
        foreach (var segment in segments)
        {
            Day(LocalDay(segment.Start)).Of(employeeId).Busy.Add(segment);
        }
    }

    /// <summary>
    /// Mécanicien possible avec ses morceaux de travail : le moins chargé du jour (puis le plus petit identifiant),
    /// ou le premier libre (plus petit identifiant) si firstFree.
    /// </summary>
    private (long EmployeeId, List<Period> Segments)? FindMechanic(DateTime startUtc, int workMinutes, bool sameDay = false, bool firstFree = false)
    {
        EnsureJobsPlaced();
        (long EmployeeId, List<Period> Segments)? best = null;
        double bestLoad = double.MaxValue;
        var day = Day(LocalDay(startUtc));
        foreach (var mechanic in _mechanics.OrderBy(m => m.EmployeeId))
        {
            var segments = Schedule(mechanic.EmployeeId, startUtc, workMinutes, sameDay);
            if (segments is null)
            {
                continue;
            }

            if (firstFree)
            {
                return (mechanic.EmployeeId, segments);
            }

            var load = day.Of(mechanic.EmployeeId).LoadMinutes;
            if (load < bestLoad)
            {
                best = (mechanic.EmployeeId, segments);
                bestLoad = load;
            }
        }

        return best;
    }

    /// <summary>Travail placé chez le moins chargé qui a des plages, même s'il est occupé.</summary>
    private (long EmployeeId, List<Period> Segments)? ForcedSegments(DateTime startUtc, int workMinutes)
    {
        var day = Day(LocalDay(startUtc));
        foreach (var mechanic in _mechanics.OrderBy(m => day.Of(m.EmployeeId).LoadMinutes).ThenBy(m => m.EmployeeId))
        {
            if (Schedule(mechanic.EmployeeId, startUtc, workMinutes, sameDay: false, force: true) is { } segments)
            {
                return (mechanic.EmployeeId, segments);
            }
        }

        return null;
    }

    private DateTime EstimateEnd(DateTime startUtc, int workMinutes) =>
        ForcedSegments(startUtc, workMinutes)?.Segments[^1].End ?? startUtc.AddMinutes(workMinutes);

    /// <summary>
    /// Morceaux de travail si le mécanicien commence à startUtc : il doit être en poste et libre à cette heure,
    /// le travail saute ses pauses et ses jours sans plage, sans chevaucher un autre travail.
    /// sameDay : il doit finir le jour même. force : horaires seuls, même s'il est occupé ou pas encore en poste.
    /// </summary>
    private List<Period>? Schedule(long employeeId, DateTime startUtc, int workMinutes, bool sameDay, bool force = false)
    {
        var day = LocalDay(startUtc);
        if (!force && !Day(day).Of(employeeId).Work.Any(p => p.Start <= startUtc && startUtc < p.End))
        {
            return null;
        }

        var segments = new List<Period>();
        var remaining = TimeSpan.FromMinutes(workMinutes);
        for (var i = 0; i < MaxPlanningDays && remaining > TimeSpan.Zero; i++, day = day.AddDays(1))
        {
            var mechanic = Day(day).Of(employeeId);
            foreach (var period in mechanic.Work.Where(p => p.End > startUtc))
            {
                var segmentStart = period.Start > startUtc ? period.Start : startUtc;
                var segmentEnd = segmentStart + remaining < period.End ? segmentStart + remaining : period.End;
                if (!force && mechanic.Busy.Any(b => b.Overlaps(segmentStart, segmentEnd)))
                {
                    return null;
                }

                segments.Add(new Period(segmentStart, segmentEnd));
                remaining -= segmentEnd - segmentStart;
                if (remaining <= TimeSpan.Zero)
                {
                    break;
                }
            }

            if (sameDay)
            {
                break;
            }
        }

        return remaining > TimeSpan.Zero ? null : segments;
    }

    /// <summary>Plages de travail du jour (UTC), dans les heures d'ouverture, absences retirées.</summary>
    private List<Period> WorkPeriods(Mechanic mechanic, DateOnly day)
    {
        if (!_garage.IsOpenOn(day.DayOfWeek))
        {
            return [];
        }

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

        public bool WorksDuring(DateTime start, DateTime end) => Work.Any(p => p.Start <= start && end <= p.End);

        public bool BusyDuring(DateTime start, DateTime end) => Busy.Any(b => b.Overlaps(start, end));
    }

    private sealed class DayPlan(List<MechanicDay> mechanics)
    {
        public MechanicDay Of(long employeeId) => mechanics.First(m => m.EmployeeId == employeeId);

        /// <summary>(libres, en poste) sur [start, end[.</summary>
        public (int Free, int Total) Count(DateTime start, DateTime end)
        {
            var working = mechanics.Where(m => m.WorksDuring(start, end)).ToList();
            return (working.Count(m => !m.BusyDuring(start, end)), working.Count);
        }
    }
}
