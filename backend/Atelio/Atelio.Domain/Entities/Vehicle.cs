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

    // Finition / motorisation (ex. « SW 1.6 HDi »).
    [Column("version")]
    public string? Version { get; set; }

    // Année de la 1re mise en circulation (reprise de FirstRegistration quand elle est connue).
    [Column("year")]
    public short? Year { get; set; }

    // Date de 1re mise en circulation (carte grise, case B).
    [Column("first_registration")]
    public DateOnly? FirstRegistration { get; set; }

    [Column("fuel")]
    public VehicleFuel? Fuel { get; set; }

    [Column("gearbox")]
    public VehicleGearbox? Gearbox { get; set; }

    // Poids en kg (carte grise, case G.1). Facultatif.
    [Column("weight_kg")]
    public int? WeightKg { get; set; }

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

    /// <summary>Informations à connaître avant d'entrer le véhicule en atelier (vide : complet).</summary>
    public IReadOnlyList<string> MissingDetails()
    {
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(Make)) missing.Add("marque");
        if (string.IsNullOrWhiteSpace(Model)) missing.Add("modèle");
        if (string.IsNullOrWhiteSpace(Version)) missing.Add("version");
        if (FirstRegistration is null) missing.Add("date de 1re mise en circulation");
        if (Fuel is null) missing.Add("énergie");
        if (Gearbox is null) missing.Add("boîte de vitesses");
        return missing;
    }
}
