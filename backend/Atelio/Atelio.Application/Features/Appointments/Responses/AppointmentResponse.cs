namespace Atelio.Application.Features.Appointments.Responses;

public class AppointmentResponse
{
    public long Id { get; set; }

    public string Reference { get; set; } = null!;

    public long CustomerId { get; set; }

    public string CustomerFirstName { get; set; } = null!;

    public string CustomerLastName { get; set; } = null!;

    public string? CustomerPhone { get; set; }

    public string? CustomerEmail { get; set; }

    // Statut (table appointment_status) : id = AppointmentStatus, libellé de la table.
    public int StatusId { get; set; }

    public string StatusLabel { get; set; } = null!;

    public DateTime ScheduledAt { get; set; }

    public DateTime EstimatedEndAt { get; set; }

    public string? CustomerNotes { get; set; }

    public long GarageId { get; set; }

    public string GarageName { get; set; } = null!;

    public string GarageAddress { get; set; } = null!;

    public long VehicleId { get; set; }

    public string VehiclePlate { get; set; } = null!;

    public string? VehicleMake { get; set; }

    public string? VehicleModel { get; set; }

    public string[] ServiceCodes { get; set; } = [];

    public string[] ServiceNames { get; set; } = [];

    // Intervention ouverte à partir du rendez-vous (null si pas encore lancé).
    public long? InterventionId { get; set; }

    // Statut de l'intervention (table intervention_status), null si pas encore lancé.
    public int? InterventionStatusId { get; set; }

    public string? InterventionStatusLabel { get; set; }
}

public class AppointmentCreatedResponse
{
    public long Id { get; set; }

    public string Reference { get; set; } = null!;

    public DateTime ScheduledAt { get; set; }

    public DateTime EstimatedEndAt { get; set; }
}

/// <summary>Vérification avant lancement d'un rendez-vous à une heure donnée.</summary>
public class StartCheckResponse
{
    // Un mécanicien est libre pour tout le travail. Sinon, le lancement reste possible (avertissement).
    public bool Possible { get; set; }

    public string? Message { get; set; }

    public DateTime StartAt { get; set; }

    // Fin estimée, pauses du mécanicien comprises (début + durée si aucun mécanicien libre).
    public DateTime EstimatedEndAt { get; set; }

    // Premier mécanicien libre, affecté au lancement.
    public long? EmployeeId { get; set; }

    public string? EmployeeName { get; set; }
}
