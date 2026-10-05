using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Employé d'un garage : les mécaniciens présents donnent la capacité du garage.
[Table("employee")]
public class Employee
{
    [Column("id")]
    public long Id { get; set; }

    [Column("garage_id")]
    public long GarageId { get; set; }

    [Column("first_name")]
    public string FirstName { get; set; } = null!;

    [Column("last_name")]
    public string LastName { get; set; } = null!;

    [Column("role")]
    public EmployeeRole Role { get; set; } = EmployeeRole.Mechanic;

    [Column("email")]
    public string? Email { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
