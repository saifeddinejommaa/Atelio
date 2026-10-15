using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class EmployeeRepository : Repository<Employee>, IEmployeeRepository
{
    public EmployeeRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<Employee>> GetActiveMechanicsAsync(long garageId, CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking()
            .Where(e => e.GarageId == garageId && e.IsActive && e.Role == EmployeeRole.Mechanic)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToListAsync(cancellationToken);

    public Task<Employee?> GetByEntraObjectIdAsync(string objectId, CancellationToken cancellationToken = default) =>
        DbSet.FirstOrDefaultAsync(e => e.EntraObjectId == objectId, cancellationToken);

    public Task<Employee?> GetUnlinkedByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim().ToLower();
        return DbSet.FirstOrDefaultAsync(
            e => e.IsActive && e.EntraObjectId == null && e.Email != null && e.Email.ToLower() == normalized,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Employee>> GetActiveByGarageAsync(long garageId, CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking()
            .Where(e => e.GarageId == garageId && e.IsActive)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToListAsync(cancellationToken);
}

public class EmployeeScheduleRepository : Repository<EmployeeSchedule>, IEmployeeScheduleRepository
{
    public EmployeeScheduleRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<EmployeeSchedule>> GetByEmployeesAsync(
        IReadOnlyCollection<long> employeeIds, CancellationToken cancellationToken = default) =>
        await DbSet
            .Where(s => employeeIds.Contains(s.EmployeeId))
            .OrderBy(s => s.EmployeeId)
            .ThenBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
}

public class EmployeeAbsenceRepository : Repository<EmployeeAbsence>, IEmployeeAbsenceRepository
{
    public EmployeeAbsenceRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public async Task<IReadOnlyList<EmployeeAbsence>> GetByEmployeesAsync(
        IReadOnlyCollection<long> employeeIds, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default) =>
        await DbSet.AsNoTracking()
            .Where(a => employeeIds.Contains(a.EmployeeId) && a.StartAt < toUtc && fromUtc < a.EndAt)
            .OrderBy(a => a.StartAt)
            .ToListAsync(cancellationToken);
}
