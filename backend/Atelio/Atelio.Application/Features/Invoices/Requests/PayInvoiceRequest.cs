namespace Atelio.Application.Features.Invoices.Requests;

public class PayInvoiceRequest
{
    // card, cash, transfer, check
    public string Method { get; set; } = null!;
}
