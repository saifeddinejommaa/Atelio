using Atelio.Domain.Entities;
using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

public interface IServiceRepository : IRepository<Service>
{
    Task<IReadOnlyList<Service>> GetActiveByIdsAsync(IReadOnlyCollection<long> ids, CancellationToken cancellationToken = default);

    /// <summary>Prestations, actives ou non (ex. libellés d'une facture).</summary>
    Task<IReadOnlyList<Service>> GetByIdsAsync(IReadOnlyCollection<long> ids, CancellationToken cancellationToken = default);
}
