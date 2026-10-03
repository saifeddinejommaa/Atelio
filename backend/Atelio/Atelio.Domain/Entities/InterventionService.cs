using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Service réalisé pendant une intervention (prix figé).
[Table("intervention_service")]
public class InterventionService
{
    [Column("intervention_id")]
    public long InterventionId { get; set; }

    [Column("service_id")]
    public long ServiceId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; } = 1;

    // TTC.
    [Column("unit_price")]
    public decimal UnitPrice { get; set; }
}
