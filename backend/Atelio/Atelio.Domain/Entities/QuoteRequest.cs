using System.ComponentModel.DataAnnotations.Schema;

namespace Atelio.Domain.Entities;

// Demande de devis d'un client (site b2c), à traiter par le garage.
[Table("quote_request")]
public class QuoteRequest
{
    [Column("id")]
    public long Id { get; set; }

    [Column("customer_id")]
    public long CustomerId { get; set; }

    [Column("vehicle_id")]
    public long VehicleId { get; set; }

    [Column("message")]
    public string? Message { get; set; }

    // Devis établi par le garage : renseigné, la demande est traitée.
    [Column("quote_id")]
    public long? QuoteId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    public List<QuoteRequestService> Services { get; set; } = [];
}

// Prestation souhaitée par le client.
[Table("quote_request_service")]
public class QuoteRequestService
{
    [Column("quote_request_id")]
    public long QuoteRequestId { get; set; }

    [Column("service_id")]
    public long ServiceId { get; set; }
}
