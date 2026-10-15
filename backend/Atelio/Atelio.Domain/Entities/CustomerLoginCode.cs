using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Code de connexion envoyé par e-mail au client (site b2c). Seule son empreinte est stockée.
[Table("customer_login_code")]
public class CustomerLoginCode
{
    [Column("id")]
    public long Id { get; set; }

    // En minuscules.
    [Column("email")]
    public string Email { get; set; } = null!;

    // HMAC-SHA256 (hexadécimal) de l'e-mail et du code.
    [Column("code_hash")]
    public string CodeHash { get; set; } = null!;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    // Essais erronés.
    [Column("attempts")]
    public short Attempts { get; set; }

    // Code utilisé : il ne sert plus.
    [Column("consumed_at")]
    public DateTime? ConsumedAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
