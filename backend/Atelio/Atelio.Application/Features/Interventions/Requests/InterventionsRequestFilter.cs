namespace Atelio.Application.Features.Interventions.Requests;

public class InterventionsRequestFilter
{
    public long? GarageId { get; set; }

    // Id du statut (InterventionStatus).
    public int? StatusId { get; set; }

    // Référence du rendez-vous (ou n° d'intervention), nom ou prénom du client.
    public string? Search { get; set; }
}
