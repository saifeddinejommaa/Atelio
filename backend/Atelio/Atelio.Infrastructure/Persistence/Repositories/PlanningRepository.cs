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

    public async Task<IReadOnlyList<Mechanic>> GetMechanicsAsync(
        long garageId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default)
    {
        var mechanics = await _context.Employees
            .Where(e => e.GarageId == garageId && e.IsActive && e.Role == EmployeeRole.Mechanic)
            .Select(e => e.Id)
            .ToListAsync(cancellationToken);

        var schedules = await _context.EmployeeSchedules
            .Where(s => mechanics.Contains(s.EmployeeId))
            .ToListAsync(cancellationToken);

        var absences = await _context.EmployeeAbsences
            .Where(a => mechanics.Contains(a.EmployeeId) && a.StartAt < toUtc && fromUtc < a.EndAt)
            .ToListAsync(cancellationToken);

        return mechanics
            .Select(id => new Mechanic(
                id,
                schedules.Where(s => s.EmployeeId == id).Select(s => new ScheduleRange(s.DayOfWeek, s.StartTime, s.EndTime)).ToList(),
                absences.Where(a => a.EmployeeId == id).Select(a => new Period(a.StartAt, a.EndAt)).ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<PlannedJob>> GetPlannedJobsAsync(
        long garageId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default,
        long? excludeAppointmentId = null)
    {
        // Durée de travail = somme des prestations (la fin estimée, elle, inclut les pauses).
        var appointments = await _context.Appointments
            .Where(a => a.GarageId == garageId
                && (excludeAppointmentId == null || a.Id != excludeAppointmentId)
                && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed)
                && fromUtc <= a.ScheduledAt && a.ScheduledAt < toUtc)
            .Select(a => new
            {
                a.Id,
                a.ScheduledAt,
                Minutes = _context.AppointmentServices
                    .Where(s => s.AppointmentId == a.Id)
                    .Join(_context.Services, s => s.ServiceId, s => s.Id, (link, service) => service.DurationMinutes)
                    .Sum(),
            })
            .ToListAsync(cancellationToken);

        var interventions = await _context.Interventions
            .Where(i => i.GarageId == garageId
                && i.Status == InterventionStatus.InProgress
                && i.StartedAt != null && fromUtc <= i.StartedAt && i.StartedAt < toUtc)
            .Select(i => new
            {
                StartedAt = i.StartedAt!.Value,
                i.EmployeeId,
                Minutes = _context.InterventionServices
                    .Where(s => s.InterventionId == i.Id)
                    .Join(_context.Services, s => s.ServiceId, s => s.Id, (link, service) => service.DurationMinutes * link.Quantity)
                    .Sum(),
            })
            .ToListAsync(cancellationToken);

        return appointments
            .Select(a => new PlannedJob(a.Id, a.ScheduledAt, a.Minutes, null))
            .Concat(interventions.Select(i => new PlannedJob(null, i.StartedAt, i.Minutes, i.EmployeeId)))
            .Where(j => j.WorkMinutes > 0)
            .ToList();
    }
}
