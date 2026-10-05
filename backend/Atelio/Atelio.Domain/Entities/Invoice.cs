using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Facture d'une intervention : montants figés à l'émission.
[Table("invoice")]
public class Invoice
{
    [Column("id")]
    public long Id { get; set; }

    [Column("intervention_id")]
    public long InterventionId { get; set; }

    // Numérotation continue (ex. F-2026-000123).
    [Column("number")]
    public string Number { get; set; } = null!;

    [Column("issued_at")]
    public DateTime IssuedAt { get; set; }

    [Column("due_date")]
    public DateOnly? DueDate { get; set; }

    [Column("total_ht")]
    public decimal TotalHt { get; set; }

    [Column("total_vat")]
    public decimal TotalVat { get; set; }

    [Column("total_ttc")]
    public decimal TotalTtc { get; set; }

    [Column("status")]
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Issued;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    public List<InvoiceLine> Lines { get; set; } = [];
}
