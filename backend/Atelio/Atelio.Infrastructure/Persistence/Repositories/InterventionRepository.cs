using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class InterventionRepository : Repository<Intervention>, IInterventionRepository
{
    public InterventionRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<InterventionService?> GetServiceLineAsync(long interventionId, long serviceId, CancellationToken cancellationToken = default) =>
        Context.InterventionServices.FirstOrDefaultAsync(s => s.InterventionId == interventionId && s.ServiceId == serviceId, cancellationToken);

    public Task<Intervention?> GetWithLinesAsync(long interventionId, CancellationToken cancellationToken = default) =>
        DbSet.Include(i => i.Services).Include(i => i.SpareParts).FirstOrDefaultAsync(i => i.Id == interventionId, cancellationToken);
}

public class SparePartRepository : Repository<SparePart>, ISparePartRepository
{
    public SparePartRepository(AtelioDbContext context)
        : base(context)
    {
    }
}
