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
        return DbSet.AsNoTracking().FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == normalized, cancellationToken);
    }

    public Task<bool> ExistsByEmailAsync(string email, long? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return DbSet.AnyAsync(
            c => c.Email != null && c.Email.ToLower() == normalized && (excludeId == null || c.Id != excludeId),
            cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> GetActiveByPhoneKeyAsync(string phoneKey, CancellationToken cancellationToken = default)
    {
        // Les numéros sont enregistrés tels que saisis : on retire les séparateurs usuels avant de comparer
        // (replace() côté PostgreSQL ; Regex.Replace n'y remplace que la première occurrence).
        return await DbSet.AsNoTracking()
            .Where(c => c.IsActive
                && c.Phone != null
                && c.Phone.Replace(" ", "").Replace(".", "").Replace("-", "").Replace("/", "").Replace("(", "").Replace(")", "")
                    .EndsWith(phoneKey))
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync(cancellationToken);
    }
}
