using Atelio.Domain.Entities;

namespace Atelio.Domain.Planning;

/// <summary>Période [Start, End[ en UTC.</summary>
public readonly record struct Period(DateTime Start, DateTime End)
{
    public bool Overlaps(DateTime start, DateTime end) => Start < end && start < End;
}

/// <summary>Un mécanicien et ses absences.</summary>
public record MechanicAvailability(long EmployeeId, IReadOnlyList<Period> Absences);

/// <summary>Créneau proposé au client, en heure locale du garage.</summary>
public record Slot(DateTime LocalStart, DateTime StartUtc, DateTime EndUtc, bool Available);

/// <summary>
/// Place les rendez-vous : un créneau est libre si, sur toute sa durée, il reste au moins
/// un mécanicien présent (non absent) qui n'est pas déjà pris par un autre rendez-vous.
/// Le garage doit être ouvert ce jour-là et le rendez-vous doit finir avant la fermeture.
/// </summary>
public class SlotPlanner
{
    public const int StepMinutes = 30;

    private readonly Garage _garage;
    private readonly TimeZoneInfo _timeZone;
    private readonly IReadOnlyList<MechanicAvailability> _mechanics;
    private readonly IReadOnlyList<Period> _booked;

    public SlotPlanner(
        Garage garage,
        TimeZoneInfo timeZone,
        IReadOnlyList<MechanicAvailability> mechanics,
        IReadOnlyList<Period> booked)
    {
        _garage = garage;
        _timeZone = timeZone;
        _mechanics = mechanics;
        _booked = booked;
    }

    /// <summary>Créneaux d'une journée (heure locale du garage) pour une durée donnée.</summary>
    public IReadOnlyList<Slot> GetSlots(DateOnly day, int durationMinutes, DateTime nowUtc)
    {
        var slots = new List<Slot>();
        if (!_garage.IsOpenOn(day.DayOfWeek))
        {
            return slots;
        }

        var start = day.ToDateTime(_garage.OpeningTime);
        var closing = day.ToDateTime(_garage.ClosingTime);

        for (var localStart = start; localStart.AddMinutes(durationMinutes) <= closing; localStart = localStart.AddMinutes(StepMinutes))
        {
            var startUtc = ToUtc(localStart);
            var endUtc = startUtc.AddMinutes(durationMinutes);
            var available = startUtc > nowUtc && HasCapacity(startUtc, endUtc);
            slots.Add(new Slot(localStart, startUtc, endUtc, available));
        }

        return slots;
    }

    /// <summary>Le rendez-vous tient entre l'ouverture et la fermeture d'un jour ouvert.</summary>
    public bool IsWithinOpeningHours(DateTime localStart, int durationMinutes)
    {
        var day = DateOnly.FromDateTime(localStart);
        var time = TimeOnly.FromDateTime(localStart);
        var end = time.AddMinutes(durationMinutes);

        return _garage.IsOpenOn(day.DayOfWeek)
            && time >= _garage.OpeningTime
            && end <= _garage.ClosingTime
            && end > time; // ne dépasse pas minuit
    }

    /// <summary>Vérifie qu'un rendez-vous peut être placé à cette heure locale.</summary>
    public bool CanBook(DateTime localStart, int durationMinutes, DateTime nowUtc)
    {
        if (!IsWithinOpeningHours(localStart, durationMinutes))
        {
            return false;
        }

        var startUtc = ToUtc(localStart);
        return startUtc > nowUtc && HasCapacity(startUtc, startUtc.AddMinutes(durationMinutes));
    }

    public DateTime ToUtc(DateTime local) =>
        TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local, DateTimeKind.Unspecified), _timeZone);

    private bool HasCapacity(DateTime startUtc, DateTime endUtc)
    {
        // Prudent : on compte les mécaniciens présents sur TOUTE la période,
        // et tous les rendez-vous qui la chevauchent.
        var present = _mechanics.Count(m => !m.Absences.Any(a => a.Overlaps(startUtc, endUtc)));
        var booked = _booked.Count(b => b.Overlaps(startUtc, endUtc));
        return booked < present;
    }
}
