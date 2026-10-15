using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Ligne figée d'une facture, copiée de l'intervention à l'émission.
// Prix TTC pour la main-d'œuvre et les pièces (anciennes factures), HT pour les articles.
[Table("invoice_line")]
public class InvoiceLine
{
    [Column("id")]
    public long Id { get; set; }

    [Column("invoice_id")]
    public long InvoiceId { get; set; }

    [Column("kind")]
    public InvoiceLineKind Kind { get; set; }

    [Column("label")]
    public string Label { get; set; } = null!;

    [Column("reference")]
    public string? Reference { get; set; }

    // Opérations de l'article.
    [Column("description")]
    public string? Description { get; set; }

    [Column("quantity")]
    public decimal Quantity { get; set; }

    [Column("unit_price")]
    public decimal UnitPrice { get; set; }

    // Remise de la promotion appliquée à la ligne (ex. 20 pour -20 %), sinon null.
    [Column("discount_percent")]
    public decimal? DiscountPercent { get; set; }

    // Titre de la promotion, figé à l'émission.
    [Column("discount_label")]
    public string? DiscountLabel { get; set; }

    // Quantité × prix unitaire, remise déduite.
    [Column("total")]
    public decimal Total { get; set; }

    [Column("sort_order")]
    public short SortOrder { get; set; }
}
