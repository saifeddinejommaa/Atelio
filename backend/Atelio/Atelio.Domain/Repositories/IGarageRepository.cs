using Atelio.Domain.Entities;
using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

public interface IGarageRepository : IRepository<Garage>
{
    /// <summary>Identifiants des services réalisés par le garage.</summary>
    Task<IReadOnlyList<long>> GetServiceIdsAsync(long garageId, CancellationToken cancellationToken = default);
}
