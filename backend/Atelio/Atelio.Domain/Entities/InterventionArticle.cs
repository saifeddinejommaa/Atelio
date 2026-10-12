using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Article importé sur une intervention : copie figée du nom, de la description et du prix HT du catalogue.
[Table("intervention_article")]
public class InterventionArticle
{
    [Column("id")]
    public long Id { get; set; }

    [Column("intervention_id")]
    public long InterventionId { get; set; }

    [Column("article_id")]
    public long ArticleId { get; set; }

    // Devis d'où vient la ligne (import), sinon null.
    [Column("quote_id")]
    public long? QuoteId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    // € HT.
    [Column("unit_price_ht")]
    public decimal UnitPriceHt { get; set; }

    // Décimale possible (ex. 4,5 L).
    [Column("quantity")]
    public decimal Quantity { get; set; } = 1;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
