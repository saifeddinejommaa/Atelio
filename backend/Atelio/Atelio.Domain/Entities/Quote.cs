using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Devis établi par un garage pour un véhicule d'un client, à partir des articles du catalogue (prix HT).
[Table("quote")]
public class Quote
{
    [Column("id")]
    public long Id { get; set; }

    // D-2026-000001.
    [Column("number")]
    public string Number { get; set; } = null!;

    [Column("customer_id")]
    public long CustomerId { get; set; }

    [Column("vehicle_id")]
    public long VehicleId { get; set; }

    [Column("garage_id")]
    public long GarageId { get; set; }

    [Column("total_ht")]
    public decimal TotalHt { get; set; }

    [Column("total_vat")]
    public decimal TotalVat { get; set; }

    [Column("total_ttc")]
    public decimal TotalTtc { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    public List<QuoteLine> Lines { get; set; } = [];
}

// Ligne figée d'un devis : copie de l'article (nom, description, prix HT).
[Table("quote_line")]
public class QuoteLine
{
    [Column("id")]
    public long Id { get; set; }

    [Column("quote_id")]
    public long QuoteId { get; set; }

    [Column("article_id")]
    public long ArticleId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    [Column("unit_price_ht")]
    public decimal UnitPriceHt { get; set; }

    [Column("quantity")]
    public decimal Quantity { get; set; }

    // HT.
    [Column("total")]
    public decimal Total { get; set; }

    [Column("sort_order")]
    public short SortOrder { get; set; }
}
