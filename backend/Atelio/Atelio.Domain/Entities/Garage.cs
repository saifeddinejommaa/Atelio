using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Garage (adresse) de la marque.
[Table("garage")]
public class Garage
{
    [Column("id")]
    public long Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("address_line")]
    public string AddressLine { get; set; } = null!;

    [Column("postal_code")]
    public string PostalCode { get; set; } = null!;

    [Column("city")]
    public string City { get; set; } = null!;

    [Column("country")]
    public string Country { get; set; } = "FR";

    [Column("latitude")]
    public decimal Latitude { get; set; }

    [Column("longitude")]
    public decimal Longitude { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("opening_time")]
    public TimeOnly OpeningTime { get; set; }

    [Column("closing_time")]
    public TimeOnly ClosingTime { get; set; }

    // Jours ouverts : 1 = lundi ... 7 = dimanche.
    [Column("open_days")]
    public short[] OpenDays { get; set; } = [];

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    public bool IsOpenOn(DayOfWeek day) =>
        OpenDays.Contains((short)(day == DayOfWeek.Sunday ? 7 : (int)day));
}
