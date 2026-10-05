namespace Atelio.Application.Features.Appointments.Requests;

public class AppointmentsRequestFilter
{
    public long? CustomerId { get; set; }

    public long? GarageId { get; set; }

    // pending, confirmed, cancelled, completed, no_show
    public string? Status { get; set; }

    // Uniquement les rendez-vous à venir.
    public bool UpcomingOnly { get; set; }

    // Premier jour inclus, heure locale du garage (ex. 2026-10-01).
    public DateOnly? From { get; set; }

    // Dernier jour inclus, heure locale du garage (ex. 2026-10-31).
    public DateOnly? To { get; set; }
}
