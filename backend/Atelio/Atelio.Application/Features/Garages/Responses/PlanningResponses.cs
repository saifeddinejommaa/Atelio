namespace Atelio.Application.Features.Garages.Responses;

/// <summary>Places sur une période [Start, End[ en UTC.</summary>
public class CapacityResponse
{
    public DateTime Start { get; set; }

    public DateTime End { get; set; }

    // Mécaniciens encore libres.
    public int Free { get; set; }

    // Mécaniciens présents (non absents).
    public int Total { get; set; }
}

public class SlotCheckResponse
{
    public bool Available { get; set; }

    // Raison si le créneau n'est pas disponible.
    public string? Message { get; set; }

    // Durée de travail (hors pauses).
    public int DurationMinutes { get; set; }

    // Fin estimée (UTC), pauses du mécanicien comprises, si le créneau est disponible.
    public DateTime? EstimatedEndAt { get; set; }

    // Conseil non bloquant (ex. prestation à durée incertaine l'après-midi).
    public string? Warning { get; set; }
}
