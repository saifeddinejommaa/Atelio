using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Service proposé par la marque (vidange, freinage...).
[Table("service")]
public class Service
{
    [Column("id")]
    public long Id { get; set; }

    // Identifiant utilisé dans les URL (ex. "freinage").
    [Column("code")]
    public string Code { get; set; } = null!;

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    // Prix TTC, avant promotion.
    [Column("price")]
    public decimal Price { get; set; }

    // Durée estimée : sert au placement des rendez-vous.
    [Column("duration_minutes")]
    public int DurationMinutes { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
