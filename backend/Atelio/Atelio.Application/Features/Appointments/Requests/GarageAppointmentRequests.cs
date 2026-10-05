namespace Atelio.Application.Features.Appointments.Requests;

public class RescheduleAppointmentRequest
{
    // Nouvelle heure locale du garage, ex. "2026-10-12T14:00".
    public DateTime ScheduledAt { get; set; }
}

public class AbandonAppointmentRequest
{
    // "cancelled" (annulé) ou "no_show" (client non venu).
    public string Status { get; set; } = null!;
}

public class StartAppointmentRequest
{
    // Début réel, heure locale du garage (ex. "2026-10-12T14:20"). Par défaut : maintenant.
    public DateTime? StartAt { get; set; }
}
