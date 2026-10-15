using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class ServiceCategoryRepository : Repository<ServiceCategory>, IServiceCategoryRepository
{
    public ServiceCategoryRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<ServiceCategory>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking().OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync(cancellationToken);
}
