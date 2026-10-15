using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class VehicleRepository : Repository<Vehicle>, IVehicleRepository
{
    public VehicleRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<Vehicle>> GetActiveByCustomerAsync(long customerId, CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking()
            .Where(v => v.CustomerId == customerId && v.IsActive)
            .OrderByDescending(v => v.UpdatedAt)
            .ToListAsync(cancellationToken);

    public Task<Vehicle?> GetByPlateAsync(long customerId, string plate, CancellationToken cancellationToken = default)
    {
        var normalized = plate.Trim().ToUpper();
        return DbSet.FirstOrDefaultAsync(v => v.CustomerId == customerId && v.Plate.ToUpper() == normalized, cancellationToken);
    }
}
