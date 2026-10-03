namespace Atelio.Application.Features.Appointments.Requests;

public class AppointmentsRequestFilter
{
    public long? CustomerId { get; set; }

    public long? GarageId { get; set; }

    // pending, confirmed, cancelled, completed, no_show
    public string? Status { get; set; }

    // Uniquement les rendez-vous à venir.
    public bool UpcomingOnly { get; set; }
}
