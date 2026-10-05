using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Tables de statuts : l'id correspond à la valeur de l'enum (ex. AppointmentStatus.Cancelled = 3).
// Un statut inactif ne peut plus être attribué, mais reste affiché sur les anciens enregistrements.
public abstract class StatusLookup
{
    [Column("id")]
    public int Id { get; set; }

    [Column("label")]
    public string Label { get; set; } = null!;

    [Column("is_active")]
    public bool IsActive { get; set; }
}

[Table("appointment_status")]
public class AppointmentStatusLookup : StatusLookup;

[Table("intervention_status")]
public class InterventionStatusLookup : StatusLookup;

[Table("invoice_status")]
public class InvoiceStatusLookup : StatusLookup;

[Table("payment_status")]
public class PaymentStatusLookup : StatusLookup;
