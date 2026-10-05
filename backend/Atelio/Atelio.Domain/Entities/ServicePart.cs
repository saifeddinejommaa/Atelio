using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Kit d'une prestation : pièces à prévoir (aide-mémoire), sans référence ni quantité,
// à compléter sur l'intervention selon le véhicule.
[Table("service_part")]
public class ServicePart
{
    [Column("id")]
    public long Id { get; set; }

    [Column("service_id")]
    public long ServiceId { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("sort_order")]
    public short SortOrder { get; set; }
}
