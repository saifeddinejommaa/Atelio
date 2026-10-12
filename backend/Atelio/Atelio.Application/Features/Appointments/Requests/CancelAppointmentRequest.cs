namespace Atelio.Application.Features.Appointments.Requests;

public class CancelAppointmentRequest
{
    // Le client qui annule doit être le titulaire du rendez-vous.
    public long CustomerId { get; set; }
}
