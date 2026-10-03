using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Planning;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class PlanningRepository : IPlanningRepository
{
    private readonly AtelioDbContext _context;

    public PlanningRepository(AtelioDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<MechanicAvailability>> GetMechanicsAsync(
        long garageId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default)
    {
        var mechanics = await _context.Employees
            .Where(e => e.GarageId == garageId && e.IsActive && e.Role == EmployeeRole.Mechanic)
            .Select(e => e.Id)
            .ToListAsync(cancellationToken);

        var absences = await _context.EmployeeAbsences
            .Where(a => mechanics.Contains(a.EmployeeId) && a.StartAt < toUtc && fromUtc < a.EndAt)
            .ToListAsync(cancellationToken);

        return mechanics
            .Select(id => new MechanicAvailability(
                id,
                absences.Where(a => a.EmployeeId == id).Select(a => new Period(a.StartAt, a.EndAt)).ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<Period>> GetBookedPeriodsAsync(
        long garageId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default)
    {
        var appointments = await _context.Appointments
            .Where(a => a.GarageId == garageId
                && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed)
                && a.ScheduledAt < toUtc && fromUtc < a.EstimatedEndAt)
            .Select(a => new { a.ScheduledAt, a.EstimatedEndAt })
            .ToListAsync(cancellationToken);

        return appointments.Select(a => new Period(a.ScheduledAt, a.EstimatedEndAt)).ToList();
    }
}
