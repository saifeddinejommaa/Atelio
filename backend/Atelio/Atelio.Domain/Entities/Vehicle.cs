using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Véhicule d'un client.
[Table("vehicle")]
public class Vehicle
{
    [Column("id")]
    public long Id { get; set; }

    [Column("customer_id")]
    public long CustomerId { get; set; }

    // Format AB-123-CD.
    [Column("plate")]
    public string Plate { get; set; } = null!;

    [Column("make")]
    public string? Make { get; set; }

    [Column("model")]
    public string? Model { get; set; }

    [Column("year")]
    public short? Year { get; set; }

    [Column("fuel")]
    public VehicleFuel? Fuel { get; set; }

    // Sert au calcul du devis.
    [Column("category")]
    public VehicleCategory? Category { get; set; }

    // Dernier kilométrage connu.
    [Column("mileage")]
    public int? Mileage { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
