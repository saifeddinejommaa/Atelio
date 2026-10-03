namespace Atelio.Application.Features.Appointments.Responses;

public class AppointmentResponse
{
    public long Id { get; set; }

    public string Reference { get; set; } = null!;

    public long CustomerId { get; set; }

    // pending, confirmed, cancelled, completed, no_show
    public string Status { get; set; } = null!;

    public DateTime ScheduledAt { get; set; }

    public DateTime EstimatedEndAt { get; set; }

    public string? CustomerNotes { get; set; }

    public long GarageId { get; set; }

    public string GarageName { get; set; } = null!;

    public string GarageAddress { get; set; } = null!;

    public long VehicleId { get; set; }

    public string VehiclePlate { get; set; } = null!;

    public string[] ServiceCodes { get; set; } = [];

    public string[] ServiceNames { get; set; } = [];
}

public class AppointmentCreatedResponse
{
    public long Id { get; set; }

    public string Reference { get; set; } = null!;

    public DateTime ScheduledAt { get; set; }

    public DateTime EstimatedEndAt { get; set; }
}
