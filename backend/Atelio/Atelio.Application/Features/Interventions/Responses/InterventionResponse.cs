namespace Atelio.Application.Features.Interventions.Responses;

public class InterventionResponse
{
    public long Id { get; set; }

    // planned, in_progress, done, cancelled
    public string Status { get; set; } = null!;

    // Étape : in_progress (en cours), ready (prête), invoiced (facturée), closed (payée), cancelled.
    public string Stage { get; set; } = null!;

    // Facture émise (null avant facturation).
    public long? InvoiceId { get; set; }

    public string? InvoiceNumber { get; set; }

    public decimal? InvoiceTotalTtc { get; set; }

    // Paiement (null tant que non réglée) : card, cash, transfer, check.
    public string? PaymentMethod { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? FinishedAt { get; set; }

    // Fin estimée (rendez-vous d'origine), pauses du mécanicien comprises.
    public DateTime? EstimatedEndAt { get; set; }

    public int? Mileage { get; set; }

    // Notes internes du garage.
    public string? Notes { get; set; }

    public long? AppointmentId { get; set; }

    public string? AppointmentReference { get; set; }

    // Message laissé par le client à la prise de rendez-vous.
    public string? CustomerNotes { get; set; }

    public long GarageId { get; set; }

    public string GarageName { get; set; } = null!;

    public long CustomerId { get; set; }

    public string CustomerFirstName { get; set; } = null!;

    public string CustomerLastName { get; set; } = null!;

    public string? CustomerPhone { get; set; }

    public string? CustomerEmail { get; set; }

    // Mécanicien chargé de l'intervention (null si pas encore affecté).
    public long? EmployeeId { get; set; }

    public string? EmployeeFirstName { get; set; }

    public string? EmployeeLastName { get; set; }

    public long VehicleId { get; set; }

    public string VehiclePlate { get; set; } = null!;

    public string? VehicleMake { get; set; }

    public string? VehicleModel { get; set; }

    public IReadOnlyList<InterventionServiceResponse> Services { get; set; } = [];

    public IReadOnlyList<SparePartResponse> SpareParts { get; set; } = [];

    // Pièces à prévoir selon les prestations (kits).
    public IReadOnlyList<KitItemResponse> Kit { get; set; } = [];

}

public class InterventionServiceResponse
{
    public long ServiceId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public int Quantity { get; set; }

    // Temps de main-d'œuvre (temps passé saisi, sinon durée prévue de la prestation).
    public int DurationMinutes { get; set; }

    public long? CategoryId { get; set; }

    public string? CategoryName { get; set; }

    // Taux horaire TTC de la catégorie.
    public decimal? HourlyRate { get; set; }

    // Durée incertaine (ex. « Autre ») : temps et type à saisir selon le mécanicien.
    public bool UncertainDuration { get; set; }

    // Prix unitaire TTC.
    public decimal UnitPrice { get; set; }
}

public class SparePartResponse
{
    public long Id { get; set; }

    public string? Reference { get; set; }

    public string Name { get; set; } = null!;

    public decimal Quantity { get; set; }

    // Prix unitaire TTC.
    public decimal UnitPrice { get; set; }
}

/// <summary>Pièce à prévoir pour une prestation de l'intervention (kit, aide-mémoire).</summary>
public class KitItemResponse
{
    public string ServiceName { get; set; } = null!;

    public string Name { get; set; } = null!;
}

/// <summary>Intervention dans la liste du back-office.</summary>
public class InterventionSummaryResponse
{
    public long Id { get; set; }

    // Référence du rendez-vous d'origine (null pour une intervention sans rendez-vous).
    public string? Reference { get; set; }

    // Étape : in_progress, ready, invoiced, closed, cancelled.
    public string Stage { get; set; } = null!;

    public DateTime? StartedAt { get; set; }

    public string CustomerFirstName { get; set; } = null!;

    public string CustomerLastName { get; set; } = null!;

    public string VehiclePlate { get; set; } = null!;
}
