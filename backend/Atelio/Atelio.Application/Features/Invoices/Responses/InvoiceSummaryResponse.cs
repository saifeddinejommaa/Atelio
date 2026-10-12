using Atelio.Application.Common;

namespace Atelio.Application.Features.Invoices.Responses;

/// <summary>Facture dans la liste du back-office.</summary>
public class InvoiceSummaryResponse
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

    public long CustomerId { get; set; }

    public string CustomerFirstName { get; set; } = null!;

    public string CustomerLastName { get; set; } = null!;

    public string VehiclePlate { get; set; } = null!;

    public string? VehicleMake { get; set; }

    public string? VehicleModel { get; set; }
}

/// <summary>Page de factures, avec les totaux de toutes les factures filtrées (pas seulement la page).</summary>
public class InvoicesPageResponse : PagedResponse<InvoiceSummaryResponse>
{
    public decimal SumHt { get; set; }

    public decimal SumTtc { get; set; }
}
