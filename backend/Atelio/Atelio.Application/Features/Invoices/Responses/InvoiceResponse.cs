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
}

public class InvoiceLineResponse
{
    // labour (main-d'œuvre) ou part (pièce).
    public string Kind { get; set; } = null!;

    public string Label { get; set; } = null!;

    public string? Reference { get; set; }

    public decimal Quantity { get; set; }

    // TTC.
    public decimal UnitPrice { get; set; }

    public decimal Total { get; set; }
}
