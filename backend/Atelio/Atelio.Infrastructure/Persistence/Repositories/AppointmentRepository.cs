using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Planning;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<Appointment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default) =>
        DbSet.Include(a => a.Services).FirstOrDefaultAsync(a => a.Reference == reference.Trim().ToUpper(), cancellationToken);

    public Task<bool> ReferenceExistsAsync(string reference, CancellationToken cancellationToken = default) =>
        DbSet.AnyAsync(a => a.Reference == reference, cancellationToken);

    public async Task LockGarageScheduleAsync(long garageId, CancellationToken cancellationToken = default) =>
        // Verrou PostgreSQL libéré automatiquement à la fin de la transaction.
        await Context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({garageId})", cancellationToken);
}
