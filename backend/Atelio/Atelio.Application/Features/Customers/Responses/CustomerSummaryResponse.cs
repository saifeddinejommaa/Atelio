namespace Atelio.Application.Features.Customers.Responses;

/// <summary>Client dans la liste du back-office.</summary>
public class CustomerSummaryResponse
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public bool IsActive { get; set; }

    // Immatriculations de ses véhicules actifs, séparées par des virgules.
    public string? Plates { get; set; }

    // Dernière intervention commencée (UTC).
    public DateTime? LastVisitAt { get; set; }

    public int InvoiceCount { get; set; }
}

/// <summary>Facture d'un client (fiche client du back-office).</summary>
public class CustomerInvoiceResponse
{
    public long Id { get; set; }

    public string Number { get; set; } = null!;

    // UTC.
    public DateTime IssuedAt { get; set; }

    public decimal TotalHt { get; set; }

    public decimal TotalTtc { get; set; }

    public int StatusId { get; set; }

    public string StatusLabel { get; set; } = null!;

    public long InterventionId { get; set; }

    public string VehiclePlate { get; set; } = null!;

    public string GarageName { get; set; } = null!;
}
