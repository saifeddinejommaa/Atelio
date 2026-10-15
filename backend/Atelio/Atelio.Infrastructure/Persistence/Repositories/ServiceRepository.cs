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

    public Task<bool> NameExistsAsync(string name, long? exceptId, CancellationToken cancellationToken = default) =>
        DbSet.AnyAsync(s => s.Name.ToLower() == name.ToLower() && s.Id != exceptId, cancellationToken);

    public Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default) =>
        DbSet.AnyAsync(s => s.Code == code, cancellationToken);

    public async Task<bool> IsUsedAsync(long serviceId, CancellationToken cancellationToken = default) =>
        await Context.AppointmentServices.AnyAsync(a => a.ServiceId == serviceId, cancellationToken)
        || await Context.InterventionServices.AnyAsync(i => i.ServiceId == serviceId, cancellationToken)
        || await Context.Promotions.AnyAsync(p => p.ServiceId == serviceId, cancellationToken);

    public async Task AddToAllGaragesAsync(long serviceId, CancellationToken cancellationToken = default)
    {
        var garageIds = await Context.Garages.Select(g => g.Id).ToListAsync(cancellationToken);
        await Context.GarageServices.AddRangeAsync(
            garageIds.Select(garageId => new GarageService { GarageId = garageId, ServiceId = serviceId }),
            cancellationToken);
    }
}
