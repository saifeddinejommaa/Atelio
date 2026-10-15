using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IVehicleRepository : IRepository<Vehicle>
{
    /// <summary>Véhicules actifs d'un client, du plus récemment utilisé au plus ancien.</summary>
    Task<IReadOnlyList<Vehicle>> GetActiveByCustomerAsync(long customerId, CancellationToken cancellationToken = default);

    Task<Vehicle?> GetByPlateAsync(long customerId, string plate, CancellationToken cancellationToken = default);
}
