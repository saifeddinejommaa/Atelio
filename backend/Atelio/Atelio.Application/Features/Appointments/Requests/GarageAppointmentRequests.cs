namespace Atelio.Application.Features.Appointments.Requests;

public class RescheduleAppointmentRequest
{
    // Nouvelle heure locale du garage, ex. "2026-10-12T14:00".
    public DateTime ScheduledAt { get; set; }
}

public class AbandonAppointmentRequest
{
    // Id du statut : 3 (Cancelled, annulé) ou 5 (NoShow, client non venu).
    public int StatusId { get; set; }
}

public class StartAppointmentRequest
{
    // Début réel, heure locale du garage (ex. "2026-10-12T14:20"). Par défaut : maintenant.
    public DateTime? StartAt { get; set; }
}
