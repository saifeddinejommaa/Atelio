using Atelio.Domain.Entities;
using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

public interface IPlanningRepository
{
    /// <summary>Mécaniciens actifs du garage, avec leurs absences sur la période.</summary>
    Task<IReadOnlyList<MechanicAvailability>> GetMechanicsAsync(
        long garageId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default);

    /// <summary>Rendez-vous en attente ou confirmés du garage qui chevauchent la période.</summary>
    Task<IReadOnlyList<Period>> GetBookedPeriodsAsync(
        long garageId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default);
}
