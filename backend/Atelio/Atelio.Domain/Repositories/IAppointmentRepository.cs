using Atelio.Domain.Entities;
using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<Appointment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default);

    Task<bool> ReferenceExistsAsync(string reference, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verrouille le planning du garage jusqu'à la fin de la transaction en cours,
    /// pour que deux réservations simultanées ne dépassent pas la capacité.
    /// </summary>
    Task LockGarageScheduleAsync(long garageId, CancellationToken cancellationToken = default);
}
