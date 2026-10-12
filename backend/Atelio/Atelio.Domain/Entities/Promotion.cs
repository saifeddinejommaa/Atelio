using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Remise en % sur le prix d'un service, activable / désactivable.
// Appliquée au prix du service lors du devis et de la facturation.
[Table("promotion")]
public class Promotion
{
    [Column("id")]
    public long Id { get; set; }

    [Column("service_id")]
    public long ServiceId { get; set; }

    [Column("title")]
    public string Title { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    // Ex. 20 pour -20 %.
    [Column("discount_percent")]
    public decimal DiscountPercent { get; set; }

    /// <summary>Prix remisé, arrondi au centime.</summary>
    public decimal ApplyTo(decimal price) => Pricing.ApplyDiscount(price, DiscountPercent);

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
