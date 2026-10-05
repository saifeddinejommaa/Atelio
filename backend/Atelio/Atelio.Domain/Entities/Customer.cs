using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Client de la marque (utilisateur du site web, ou client enregistré par le garage).
[Table("customer")]
public class Customer
{
    [Column("id")]
    public long Id { get; set; }

    [Column("first_name")]
    public string FirstName { get; set; } = null!;

    [Column("last_name")]
    public string LastName { get; set; } = null!;

    // Facultatif : un client créé par le garage peut n'avoir qu'un téléphone.
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
