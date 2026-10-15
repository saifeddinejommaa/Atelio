namespace Atelio.Application.Features.Invoices.Requests;

public class PayInvoiceRequest
{
    // card, cash, transfer, check
    public string Method { get; set; } = null!;

    // Montant TTC reçu, au plus le reste à payer.
    public decimal Amount { get; set; }
}

/// <summary>Facturation : montant reçu tout de suite (0 : tout reste à payer) et son moyen de paiement.</summary>
public class IssueInvoiceRequest
{
    public decimal AmountPaid { get; set; }

    // card, cash, transfer, check (si un montant est reçu).
    public string? Method { get; set; }
}
