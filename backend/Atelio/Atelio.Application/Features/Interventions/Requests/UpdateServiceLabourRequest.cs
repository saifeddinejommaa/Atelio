namespace Atelio.Application.Features.Interventions.Requests;

public class UpdateServiceLabourRequest
{
    // Temps passé, en minutes.
    public int LabourMinutes { get; set; }

    public long CategoryId { get; set; }
}
