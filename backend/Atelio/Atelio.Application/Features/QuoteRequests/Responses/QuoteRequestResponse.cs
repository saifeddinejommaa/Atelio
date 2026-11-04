namespace Atelio.Application.Features.QuoteRequests.Responses;

/// <summary>Demande de devis avec le client, le véhicule, les prestations et le devis établi.</summary>
public class QuoteRequestResponse
{
    public long Id { get; set; }

    // UTC.
    public DateTime CreatedAt { get; set; }

    public long CustomerId { get; set; }

    public string CustomerFirstName { get; set; } = null!;

    public string CustomerLastName { get; set; } = null!;

    public string? CustomerEmail { get; set; }

    public string? CustomerPhone { get; set; }

    public long VehicleId { get; set; }

    public string VehiclePlate { get; set; } = null!;

    // Noms séparés par des virgules.
    public string Services { get; set; } = null!;

    public string? Message { get; set; }

    public long? QuoteId { get; set; }

    public string? QuoteNumber { get; set; }

    // UTC. Renseigné : le devis a été envoyé au client.
    public DateTime? QuoteSentAt { get; set; }
}
