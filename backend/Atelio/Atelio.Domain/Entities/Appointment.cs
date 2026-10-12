using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Rendez-vous pris sur le site.
[Table("appointment")]
public class Appointment
{
    [Column("id")]
    public long Id { get; set; }

    // Affichée au client (ex. RDV-8K2F9Q).
    [Column("reference")]
    public string Reference { get; set; } = null!;

    [Column("customer_id")]
    public long CustomerId { get; set; }

    [Column("vehicle_id")]
    public long VehicleId { get; set; }

    [Column("garage_id")]
    public long GarageId { get; set; }

    [Column("scheduled_at")]
    public DateTime ScheduledAt { get; set; }

    // Début + somme des durées des services demandés.
    [Column("estimated_end_at")]
    public DateTime EstimatedEndAt { get; set; }

    [Column("status_id")]
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Confirmed;

    // « Quelque chose à signaler au garage ? »
    [Column("customer_notes")]
    public string? CustomerNotes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey(nameof(VehicleId))]
    public Vehicle? Vehicle { get; set; }

    public List<AppointmentService> Services { get; set; } = [];
}
