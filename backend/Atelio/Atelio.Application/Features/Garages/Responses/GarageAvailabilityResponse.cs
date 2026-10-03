namespace Atelio.Application.Features.Garages.Responses;

public class GarageDayAvailabilityResponse
{
    // "2026-10-05"
    public string Date { get; set; } = null!;

    public IReadOnlyList<GarageSlotResponse> Slots { get; set; } = [];
}

public class GarageSlotResponse
{
    // Heure locale du garage, "09:30".
    public string Time { get; set; } = null!;

    public bool Available { get; set; }
}
