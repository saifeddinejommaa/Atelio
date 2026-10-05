using Atelio.Domain.Entities;
using Atelio.Domain.Enums;

namespace Atelio.Application.Features.Vehicles.Responses;

public class VehicleResponse
{
    public long Id { get; set; }

    public long CustomerId { get; set; }

    public string Plate { get; set; } = null!;

    public string? Make { get; set; }

    public string? Model { get; set; }

    public short? Year { get; set; }

    // petrol, diesel, hybrid, electric, lpg, other
    public VehicleFuel? Fuel { get; set; }

    // city, compact, suv, utility
    public VehicleCategory? Category { get; set; }

    public int? Mileage { get; set; }

    public static VehicleResponse From(Vehicle vehicle) => new()
    {
        Id = vehicle.Id,
        CustomerId = vehicle.CustomerId,
        Plate = vehicle.Plate,
        Make = vehicle.Make,
        Model = vehicle.Model,
        Year = vehicle.Year,
        Fuel = vehicle.Fuel,
        Category = vehicle.Category,
        Mileage = vehicle.Mileage,
    };
}
