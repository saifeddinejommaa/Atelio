using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Article du catalogue de la marque (ex. « Huile moteur » : opérations décrites, prix HT),
// importé sur les interventions. Désactivé plutôt que supprimé : les factures en gardent la copie.
[Table("article")]
public class Article
{
    [Column("id")]
    public long Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    // € HT.
    [Column("unit_price_ht")]
    public decimal UnitPriceHt { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
