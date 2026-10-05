using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Catégorie de prestations (entretien, mécanique...) avec son taux horaire de main-d'œuvre TTC,
// commun à tous les garages de la marque.
[Table("service_category")]
public class ServiceCategory
{
    [Column("id")]
    public long Id { get; set; }

    [Column("code")]
    public string Code { get; set; } = null!;

    [Column("name")]
    public string Name { get; set; } = null!;

    // € TTC par heure.
    [Column("hourly_rate")]
    public decimal HourlyRate { get; set; }

    [Column("sort_order")]
    public short SortOrder { get; set; }
}
