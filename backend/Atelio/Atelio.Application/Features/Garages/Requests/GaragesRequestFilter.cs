namespace Atelio.Application.Features.Garages.Requests;

public class GaragesRequestFilter
{
    // Ville, code postal ou adresse.
    public string? Search { get; set; }

    // Uniquement les garages qui réalisent ce service.
    public string? ServiceCode { get; set; }
}
