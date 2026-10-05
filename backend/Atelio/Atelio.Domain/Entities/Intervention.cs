using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Travail réalisé, lié au rendez-vous (facultatif) et au client.
[Table("intervention")]
public class Intervention
{
    [Column("id")]
    public long Id { get; set; }

    [Column("appointment_id")]
    public long? AppointmentId { get; set; }

    [Column("customer_id")]
    public long CustomerId { get; set; }

    [Column("vehicle_id")]
    public long VehicleId { get; set; }

    [Column("garage_id")]
    public long GarageId { get; set; }

    // Mécanicien affecté.
    [Column("employee_id")]
    public long? EmployeeId { get; set; }

    // Kilométrage relevé à l'intervention.
    [Column("mileage")]
    public int? Mileage { get; set; }

    [Column("status_id")]
    public InterventionStatus Status { get; set; } = InterventionStatus.Planned;

    [Column("started_at")]
    public DateTime? StartedAt { get; set; }

    [Column("finished_at")]
    public DateTime? FinishedAt { get; set; }

    // Notes internes du garage.
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public List<InterventionService> Services { get; set; } = [];

    public List<SparePart> SpareParts { get; set; } = [];
}
