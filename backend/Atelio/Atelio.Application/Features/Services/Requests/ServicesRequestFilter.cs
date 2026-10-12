namespace Atelio.Application.Features.Services.Requests;

public class ServicesRequestFilter
{
    // Uniquement les services réalisés par ce garage.
    public long? GarageId { get; set; }
}
