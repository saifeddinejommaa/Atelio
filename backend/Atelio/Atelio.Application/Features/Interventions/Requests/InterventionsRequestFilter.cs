namespace Atelio.Application.Features.Interventions.Requests;

public class InterventionsRequestFilter
{
    public long? GarageId { get; set; }

    // Étape : in_progress, ready, invoiced, closed, cancelled
    public string? Status { get; set; }

    // Référence du rendez-vous (ou n° d'intervention), nom ou prénom du client.
    public string? Search { get; set; }
}
