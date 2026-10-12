using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class StatusRepository : IStatusRepository
{
    private readonly AtelioDbContext _context;

    public StatusRepository(AtelioDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TStatus>> GetAllAsync<TStatus>(CancellationToken cancellationToken = default)
        where TStatus : StatusLookup =>
        await _context.Set<TStatus>().AsNoTracking().OrderBy(s => s.Id).ToListAsync(cancellationToken);
}
