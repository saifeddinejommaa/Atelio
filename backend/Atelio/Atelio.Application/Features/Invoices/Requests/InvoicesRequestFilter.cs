namespace Atelio.Application.Features.Invoices.Requests;

public class InvoicesRequestFilter
{
    public const int MaxPageSize = 100;

    public long? GarageId { get; set; }

    // Période d'émission, jours locaux du garage inclus (ex. 2026-10-01 et 2026-10-31).
    public DateOnly? From { get; set; }

    public DateOnly? To { get; set; }

    // Nom et/ou prénom du client (recherche partielle, sans tenir compte des majuscules).
    public string? Customer { get; set; }

    // Immatriculation du véhicule (recherche partielle, tirets et espaces ignorés).
    public string? Plate { get; set; }

    // Page demandée, à partir de 1.
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}
