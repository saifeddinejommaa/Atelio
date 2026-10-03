using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Service demandé lors de la réservation.
[Table("appointment_service")]
public class AppointmentService
{
    [Column("appointment_id")]
    public long AppointmentId { get; set; }

    [Column("service_id")]
    public long ServiceId { get; set; }
}
