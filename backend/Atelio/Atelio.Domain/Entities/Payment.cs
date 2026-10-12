using Atelio.Domain.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Paiement d'une facture.
[Table("payment")]
public class Payment
{
    [Column("id")]
    public long Id { get; set; }

    [Column("invoice_id")]
    public long InvoiceId { get; set; }

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("method")]
    public PaymentMethod Method { get; set; }

    [Column("status_id")]
    public PaymentStatus Status { get; set; } = PaymentStatus.Succeeded;

    // Référence du prestataire de paiement.
    [Column("transaction_id")]
    public string? TransactionId { get; set; }

    [Column("paid_at")]
    public DateTime PaidAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
