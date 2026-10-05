using Atelio.Application.Common;
using Atelio.Application.Features.Team.Responses;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;
using System.Globalization;

namespace Atelio.Application.Features.Team.Commands;

// ============================================================
// SAVE SCHEDULE (remplace tout le planning type de l'employé)
// ============================================================

/// <summary>Journée type saisie : heures locales "08:30". Pause facultative (les deux heures, ou aucune).</summary>
public class DayScheduleInput
{
    // 1 = lundi ... 7 = dimanche.
    public int DayOfWeek { get; set; }

    public string Start { get; set; } = null!;

    public string End { get; set; } = null!;

    public string? BreakStart { get; set; }

    public string? BreakEnd { get; set; }
}

public class SaveEmployeeScheduleCommand : IRequest<IReadOnlyList<DayScheduleResponse>>
{
    public long EmployeeId { get; set; }

    // Jours travaillés ; un jour absent de la liste est un jour de repos.
    public List<DayScheduleInput> Days { get; set; } = [];
}

public class SaveEmployeeScheduleCommandValidator : AbstractValidator<SaveEmployeeScheduleCommand>
{
    private static readonly string[] DayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

    public SaveEmployeeScheduleCommandValidator()
    {
        RuleFor(x => x.Days)
            .Must(days => days.Select(d => d.DayOfWeek).Distinct().Count() == days.Count)
            .WithMessage("Un même jour est saisi deux fois.");

        RuleForEach(x => x.Days).Custom((day, context) =>
        {
            if (day.DayOfWeek is < 1 or > 7)
            {
                context.AddFailure("Jour invalide.");
                return;
            }

            var name = DayNames[day.DayOfWeek - 1];
            var start = TeamTime.Parse(day.Start);
            var end = TeamTime.Parse(day.End);
            if (start is null || end is null)
            {
                context.AddFailure($"Heures d'arrivée et de départ invalides le {name} (format 08:30).");
                return;
            }

            if (end <= start)
            {
                context.AddFailure($"Le {name}, le départ doit être après l'arrivée.");
                return;
            }

            var hasBreakStart = !string.IsNullOrWhiteSpace(day.BreakStart);
            var hasBreakEnd = !string.IsNullOrWhiteSpace(day.BreakEnd);
            if (hasBreakStart != hasBreakEnd)
            {
                context.AddFailure($"Le {name}, indiquez le début et la fin de la pause, ou aucune des deux.");
                return;
            }

            if (!hasBreakStart)
            {
                return;
            }

            var breakStart = TeamTime.Parse(day.BreakStart);
            var breakEnd = TeamTime.Parse(day.BreakEnd);
            if (breakStart is null || breakEnd is null)
            {
                context.AddFailure($"Heures de pause invalides le {name} (format 12:00).");
            }
            else if (!(start < breakStart && breakStart < breakEnd && breakEnd < end))
            {
                context.AddFailure($"Le {name}, la pause doit être comprise dans la journée (après l'arrivée et avant le départ).");
            }
        });
    }
}

public class SaveEmployeeScheduleCommandHandler : IRequestHandler<SaveEmployeeScheduleCommand, IReadOnlyList<DayScheduleResponse>>
{
    private readonly IEmployeeRepository _employees;
    private readonly IEmployeeScheduleRepository _schedules;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public SaveEmployeeScheduleCommandHandler(
        IEmployeeRepository employees,
        IEmployeeScheduleRepository schedules,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _employees = employees;
        _schedules = schedules;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<IReadOnlyList<DayScheduleResponse>> Handle(SaveEmployeeScheduleCommand request, CancellationToken cancellationToken)
    {
        await TeamTime.GetActiveEmployeeAsync(_employees, request.EmployeeId, cancellationToken);
        var now = _clock.GetUtcNow().UtcDateTime;

        var ranges = request.Days
            .SelectMany(day => TeamRules
                .ToRanges(TeamTime.Parse(day.Start)!.Value, TeamTime.Parse(day.End)!.Value, TeamTime.Parse(day.BreakStart), TeamTime.Parse(day.BreakEnd))
                .Select(r => new EmployeeSchedule
                {
                    EmployeeId = request.EmployeeId,
                    DayOfWeek = (short)day.DayOfWeek,
                    StartTime = r.Start,
                    EndTime = r.End,
                    CreatedAt = now,
                    UpdatedAt = now,
                }))
            .ToList();

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            foreach (var existing in await _schedules.GetByEmployeesAsync([request.EmployeeId], ct))
            {
                _schedules.Remove(existing);
            }

            foreach (var range in ranges)
            {
                await _schedules.AddAsync(range, ct);
            }
        }, cancellationToken);

        return TeamRules.ToDays(ranges);
    }
}

// ============================================================
// DECLARE ABSENCE (jours entiers)
// ============================================================

public class DeclareAbsenceCommand : IRequest<AbsenceResponse>
{
    public long EmployeeId { get; set; }

    // Premier et dernier jour inclus, heure locale du garage.
    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    // leave, sick, training, other
    public string Reason { get; set; } = "leave";

    public string? Comment { get; set; }
}

public class DeclareAbsenceCommandValidator : AbstractValidator<DeclareAbsenceCommand>
{
    public DeclareAbsenceCommandValidator()
    {
        RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate).WithMessage("Le dernier jour doit être après le premier.");
        RuleFor(x => x.Reason)
            .Must(r => r is "leave" or "sick" or "training" or "other")
            .WithMessage("Motif attendu : congé, maladie, formation ou autre.");
        RuleFor(x => x.Comment).MaximumLength(500);
    }
}

public class DeclareAbsenceCommandHandler : IRequestHandler<DeclareAbsenceCommand, AbsenceResponse>
{
    private readonly IEmployeeRepository _employees;
    private readonly IEmployeeAbsenceRepository _absences;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public DeclareAbsenceCommandHandler(
        IEmployeeRepository employees,
        IEmployeeAbsenceRepository absences,
        IUnitOfWork unitOfWork,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _employees = employees;
        _absences = absences;
        _unitOfWork = unitOfWork;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<AbsenceResponse> Handle(DeclareAbsenceCommand request, CancellationToken cancellationToken)
    {
        await TeamTime.GetActiveEmployeeAsync(_employees, request.EmployeeId, cancellationToken);

        var startUtc = TeamRules.DayStartUtc(request.StartDate, _tenant.TimeZone);
        var endUtc = TeamRules.DayStartUtc(request.EndDate.AddDays(1), _tenant.TimeZone);

        if ((await _absences.GetByEmployeesAsync([request.EmployeeId], startUtc, endUtc, cancellationToken)).Count > 0)
        {
            throw new BusinessException("Une absence est déjà déclarée sur une partie de ces jours.");
        }

        var absence = new EmployeeAbsence
        {
            EmployeeId = request.EmployeeId,
            StartAt = startUtc,
            EndAt = endUtc,
            Reason = Enum.Parse<AbsenceReason>(request.Reason, ignoreCase: true),
            Comment = TextRules.Clean(request.Comment),
            CreatedAt = _clock.GetUtcNow().UtcDateTime,
        };

        await _absences.AddAsync(absence, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return TeamRules.ToResponse(absence, _tenant.TimeZone);
    }
}

// ============================================================
// DELETE ABSENCE
// ============================================================

public class DeleteAbsenceCommand : IRequest<Unit>
{
    public long EmployeeId { get; set; }

    public long AbsenceId { get; set; }
}

public class DeleteAbsenceCommandHandler : IRequestHandler<DeleteAbsenceCommand, Unit>
{
    private readonly IEmployeeAbsenceRepository _absences;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteAbsenceCommandHandler(IEmployeeAbsenceRepository absences, IUnitOfWork unitOfWork)
    {
        _absences = absences;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeleteAbsenceCommand request, CancellationToken cancellationToken)
    {
        var absence = await _absences.GetByIdAsync(request.AbsenceId, cancellationToken);
        if (absence is null || absence.EmployeeId != request.EmployeeId)
        {
            throw new NotFoundException($"Absence {request.AbsenceId} introuvable.");
        }

        _absences.Remove(absence);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class TeamTime
{
    /// <summary>"08:30" => 08:30, sinon null.</summary>
    public static TimeOnly? Parse(string? value) =>
        TimeOnly.TryParseExact(value?.Trim(), ["HH:mm", "H:mm", "HH:mm:ss"], CultureInfo.InvariantCulture, DateTimeStyles.None, out var time)
            ? time
            : null;

    public static async Task<Employee> GetActiveEmployeeAsync(IEmployeeRepository employees, long id, CancellationToken cancellationToken)
    {
        var employee = await employees.GetByIdAsync(id, cancellationToken);
        return employee is { IsActive: true } ? employee : throw new NotFoundException($"Employé {id} introuvable.");
    }
}
