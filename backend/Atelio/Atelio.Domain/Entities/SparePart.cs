using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Pièce de rechange utilisée pendant une intervention.
[Table("spare_part")]
public class SparePart
{
    [Column("id")]
    public long Id { get; set; }

    [Column("intervention_id")]
    public long InterventionId { get; set; }

    // Référence fabricant.
    [Column("reference")]
    public string? Reference { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("quantity")]
    public decimal Quantity { get; set; } = 1;

    // TTC.
    [Column("unit_price")]
    public decimal UnitPrice { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
