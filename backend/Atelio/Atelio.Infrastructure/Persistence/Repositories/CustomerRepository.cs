using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class CustomerRepository : Repository<Customer>, ICustomerRepository
{
    public CustomerRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return DbSet.AsNoTracking().FirstOrDefaultAsync(c => c.Email.ToLower() == normalized, cancellationToken);
    }

    public Task<bool> ExistsByEmailAsync(string email, long? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return DbSet.AnyAsync(c => c.Email.ToLower() == normalized && (excludeId == null || c.Id != excludeId), cancellationToken);
    }
}
