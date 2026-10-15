using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Remise en % sur une prestation, affichée sur le site (page « Offres du moment ») pendant sa période,
// activable / désactivable depuis le back-office.
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

    // Période d'affichage sur le site (jours locaux, bornes incluses) ; pas de fin : sans limite.
    [Column("starts_on")]
    public DateOnly StartsOn { get; set; }

    [Column("ends_on")]
    public DateOnly? EndsOn { get; set; }

    // Petit texte affiché sous l'offre (ex. « Non cumulable avec d'autres offres. »).
    [Column("conditions")]
    public string? Conditions { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
