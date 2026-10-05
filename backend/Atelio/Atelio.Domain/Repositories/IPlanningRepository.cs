using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

public interface IPlanningRepository
{
    /// <summary>Mécaniciens actifs du garage, avec leur planning type et leurs absences sur la période.</summary>
    Task<IReadOnlyList<Mechanic>> GetMechanicsAsync(
        long garageId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default);

    /// <summary>
    /// Travaux prévus qui commencent dans la période : rendez-vous en attente ou confirmés,
    /// et interventions en cours, avec leur durée de travail (somme des prestations).
    /// excludeAppointmentId : rendez-vous à ignorer (celui qu'on déplace).
    /// </summary>
    Task<IReadOnlyList<PlannedJob>> GetPlannedJobsAsync(
        long garageId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default,
        long? excludeAppointmentId = null);
}
