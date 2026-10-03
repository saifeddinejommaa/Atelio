using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Services réalisés par un garage.
[Table("garage_service")]
public class GarageService
{
    [Column("garage_id")]
    public long GarageId { get; set; }

    [Column("service_id")]
    public long ServiceId { get; set; }
}
