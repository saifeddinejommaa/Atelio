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
        // Durée de travail = estimation du garage, sinon somme des prestations (la fin estimée, elle, inclut les pauses).
        var appointments = await _context.Appointments
            .Where(a => a.GarageId == garageId
                && (excludeAppointmentId == null || a.Id != excludeAppointmentId)
                && (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed)
                && a.ScheduledAt < toUtc && fromUtc < a.EstimatedEndAt)
            .Select(a => new
            {
                a.Id,
                a.ScheduledAt,
                a.EstimatedMinutes,
                Minutes = _context.AppointmentServices
                    .Where(s => s.AppointmentId == a.Id)
                    .Join(_context.Services, s => s.ServiceId, s => s.Id, (link, service) => service.DurationMinutes ?? 0)
                    .Sum(),
                Unknown = _context.AppointmentServices
                    .Where(s => s.AppointmentId == a.Id)
                    .Join(_context.Services, s => s.ServiceId, s => s.Id, (link, service) => service.DurationMinutes)
                    .Any(minutes => minutes == null),
            })
            .ToListAsync(cancellationToken);

        var interventions = await _context.Interventions
            .Where(i => i.GarageId == garageId
                && i.Status == InterventionStatus.InProgress
                && i.StartedAt != null && i.StartedAt < toUtc)
            .Select(i => new
            {
                StartedAt = i.StartedAt!.Value,
                i.EmployeeId,
                Minutes = _context.InterventionServices
                    .Where(s => s.InterventionId == i.Id)
                    .Join(_context.Services, s => s.ServiceId, s => s.Id, (link, service) => (link.LabourMinutes ?? service.DurationMinutes ?? 0) * link.Quantity)
                    .Sum(),
                Unknown = _context.InterventionServices
                    .Where(s => s.InterventionId == i.Id)
                    .Join(_context.Services, s => s.ServiceId, s => s.Id, (link, service) => link.LabourMinutes ?? service.DurationMinutes)
                    .Any(minutes => minutes == null),
            })
            .ToListAsync(cancellationToken);

        return appointments
            // Temps inconnu : pas d'estimation, donc rien de bloqué.
            .Select(a => new PlannedJob(a.Id, a.ScheduledAt, a.EstimatedMinutes ?? (a.Unknown ? 0 : a.Minutes), null))
            .Concat(interventions.Select(i => new PlannedJob(null, i.StartedAt, i.Unknown ? 0 : i.Minutes, i.EmployeeId)))
            .Where(j => j.WorkMinutes > 0)
            .ToList();
    }
}
