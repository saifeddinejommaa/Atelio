namespace Atelio.Application.Features.Invoices.Responses;

/// <summary>Facture émise, avec ses lignes figées et son règlement.</summary>
public class InvoiceResponse
{
    public long Id { get; set; }

    public string Number { get; set; } = null!;

    public DateTime IssuedAt { get; set; }

    // Date d'échéance, "2026-10-05".
    public string? DueDate { get; set; }

    public decimal TotalHt { get; set; }

    public decimal TotalVat { get; set; }

    public decimal TotalTtc { get; set; }

    // Statut (table invoice_status) : id = InvoiceStatus, libellé de la table.
    public int StatusId { get; set; }

    public string StatusLabel { get; set; } = null!;

    public long InterventionId { get; set; }

    public string? AppointmentReference { get; set; }

    public string GarageName { get; set; } = null!;

    public string GarageAddress { get; set; } = null!;

    public string? GaragePhone { get; set; }

    public string CustomerFirstName { get; set; } = null!;

    public string CustomerLastName { get; set; } = null!;

    public string? CustomerEmail { get; set; }

    public string? CustomerPhone { get; set; }

    public string VehiclePlate { get; set; } = null!;

    public string? VehicleMake { get; set; }

    public string? VehicleModel { get; set; }

    public int? Mileage { get; set; }

    // Paiement (null tant que non réglée) : card, cash, transfer, check.
    public string? PaymentMethod { get; set; }

    public DateTime? PaidAt { get; set; }

    public IReadOnlyList<InvoiceLineResponse> Lines { get; set; } = [];

    // Règlements reçus (réussis), du plus ancien au plus récent.
    public IReadOnlyList<InvoicePaymentResponse> Payments { get; set; } = [];

    public decimal AmountPaid { get; set; }

    public decimal Remaining { get; set; }

    // Versions PDF stockées, de la plus récente à la plus ancienne (vide : facture émise avant les PDF).
    public IReadOnlyList<InvoiceDocumentResponse> Documents { get; set; } = [];
}

public class InvoicePaymentResponse
{
    // UTC.
    public DateTime PaidAt { get; set; }

    // card, cash, transfer, check
    public string Method { get; set; } = null!;

    public decimal Amount { get; set; }
}

public class InvoiceDocumentResponse
{
    public short Version { get; set; }

    // UTC.
    public DateTime CreatedAt { get; set; }
}

public class InvoiceLineResponse
{
    // article, ou labour (main-d'œuvre) / part (pièce) sur les anciennes factures.
    public string Kind { get; set; } = null!;

    public string Label { get; set; } = null!;

    public string? Reference { get; set; }

    // Opérations de l'article.
    public string? Description { get; set; }

    public decimal Quantity { get; set; }

    // HT pour un article, TTC pour la main-d'œuvre et les pièces.
    public decimal UnitPrice { get; set; }

    // Remise de la promotion appliquée à la ligne (ex. 20 pour -20 %), sinon null.
    public decimal? DiscountPercent { get; set; }

    public string? DiscountLabel { get; set; }

    // Remise déduite.
    public decimal Total { get; set; }
}
