using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class CustomerLoginCodeRepository : Repository<CustomerLoginCode>, ICustomerLoginCodeRepository
{
    public CustomerLoginCodeRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<int> CountSinceAsync(string email, DateTime sinceUtc, CancellationToken cancellationToken = default) =>
        DbSet.CountAsync(c => c.Email == email && c.CreatedAt >= sinceUtc, cancellationToken);

    public Task<CustomerLoginCode?> GetLatestUnusedAsync(string email, CancellationToken cancellationToken = default) =>
        DbSet.Where(c => c.Email == email && c.ConsumedAt == null)
            .OrderByDescending(c => c.CreatedAt)
            .ThenByDescending(c => c.Id)
            .FirstOrDefaultAsync(cancellationToken);
}
