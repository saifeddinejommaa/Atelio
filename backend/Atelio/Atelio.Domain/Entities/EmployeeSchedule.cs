using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Plage de travail du planning type d'un employé (heure locale du garage).
// Plusieurs plages le même jour = pause entre les deux. Un employé sans plage est absent.
[Table("employee_schedule")]
public class EmployeeSchedule
{
    [Column("id")]
    public long Id { get; set; }

    [Column("employee_id")]
    public long EmployeeId { get; set; }

    // 1 = lundi ... 7 = dimanche.
    [Column("day_of_week")]
    public short DayOfWeek { get; set; }

    [Column("start_time")]
    public TimeOnly StartTime { get; set; }

    [Column("end_time")]
    public TimeOnly EndTime { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
