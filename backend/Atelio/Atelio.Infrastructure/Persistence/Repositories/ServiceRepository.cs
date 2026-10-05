using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class ServiceRepository : Repository<Service>, IServiceRepository
{
    public ServiceRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<Service>> GetActiveByIdsAsync(IReadOnlyCollection<long> ids, CancellationToken cancellationToken = default) =>
        await DbSet.Where(s => ids.Contains(s.Id) && s.IsActive).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Service>> GetByIdsAsync(IReadOnlyCollection<long> ids, CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking().Where(s => ids.Contains(s.Id)).ToListAsync(cancellationToken);
}
