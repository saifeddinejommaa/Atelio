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

    [Column("total")]
    public decimal Total { get; set; }

    [Column("sort_order")]
    public short SortOrder { get; set; }
}
