namespace Atelio.Application.Features.Quotes.Responses;

/// <summary>Devis avec le garage, le client, le véhicule et ses lignes (page imprimable).</summary>
public class QuoteResponse
{
    public long Id { get; set; }

    public string Number { get; set; } = null!;

    // UTC.
    public DateTime CreatedAt { get; set; }

    public decimal TotalHt { get; set; }

    public decimal TotalVat { get; set; }

    public decimal TotalTtc { get; set; }

    public long CustomerId { get; set; }

    public string CustomerFirstName { get; set; } = null!;

    public string CustomerLastName { get; set; } = null!;

    public string? CustomerEmail { get; set; }

    public string? CustomerPhone { get; set; }

    public string VehiclePlate { get; set; } = null!;

    public string? VehicleMake { get; set; }

    public string? VehicleModel { get; set; }

    public string? VehicleVersion { get; set; }

    public string GarageName { get; set; } = null!;

    public string GarageAddress { get; set; } = null!;

    public string? GaragePhone { get; set; }

    public IReadOnlyList<QuoteLineResponse> Lines { get; set; } = [];
}

public class QuoteLineResponse
{
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Quantity { get; set; }

    // HT.
    public decimal UnitPriceHt { get; set; }

    public decimal Total { get; set; }
}

/// <summary>Devis dans la fiche client.</summary>
public class QuoteSummaryResponse
{
    public long Id { get; set; }

    public string Number { get; set; } = null!;

    // UTC.
    public DateTime CreatedAt { get; set; }

    public decimal TotalHt { get; set; }

    public decimal TotalTtc { get; set; }

    public string VehiclePlate { get; set; } = null!;

    public string GarageName { get; set; } = null!;
}
