namespace Atelio.Application.Features.Interventions.Requests;

public class InterventionsRequestFilter
{
    public const int MaxPageSize = 100;

    public long? GarageId { get; set; }

    // Id du statut (InterventionStatus).
    public int? StatusId { get; set; }

    // Nom et/ou prénom du client (recherche partielle, sans tenir compte des majuscules).
    public string? Customer { get; set; }

    // Immatriculation du véhicule (recherche partielle, tirets et espaces ignorés).
    public string? Plate { get; set; }

    // Jour de début de l'intervention, heure locale du garage (ex. 2026-10-06).
    public DateOnly? Date { get; set; }

    // Page demandée, à partir de 1.
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}
