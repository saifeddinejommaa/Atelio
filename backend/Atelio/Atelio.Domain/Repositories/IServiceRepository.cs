using Atelio.Domain.Entities;
using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

public interface IServiceRepository : IRepository<Service>
{
    Task<IReadOnlyList<Service>> GetActiveByIdsAsync(IReadOnlyCollection<long> ids, CancellationToken cancellationToken = default);
}
