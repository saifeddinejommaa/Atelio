namespace Atelio.Application.Features.Garages.Responses;

public class GarageResponse
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string AddressLine { get; set; } = null!;

    public string PostalCode { get; set; } = null!;

    public string City { get; set; } = null!;

    public string Country { get; set; } = null!;

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    // "08:00"
    public string OpeningTime { get; set; } = null!;

    public string ClosingTime { get; set; } = null!;

    // 1 = lundi ... 7 = dimanche.
    public short[] OpenDays { get; set; } = [];

    // Codes des services réalisés par le garage.
    public string[] ServiceCodes { get; set; } = [];
}
