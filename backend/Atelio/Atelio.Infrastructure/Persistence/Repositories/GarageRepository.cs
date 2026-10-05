using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class GarageRepository : Repository<Garage>, IGarageRepository
{
    public GarageRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<long>> GetServiceIdsAsync(long garageId, CancellationToken cancellationToken = default) =>
        await Context.GarageServices
            .Where(gs => gs.GarageId == garageId)
            .Select(gs => gs.ServiceId)
            .ToListAsync(cancellationToken);
}
