using Atelio.Application.Common;
using Atelio.Application.Features.Team.Responses;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Team.Queries;

/// <summary>Employés actifs du garage, avec leur planning type et leurs absences sur [From, To] (jours locaux inclus).</summary>
public class GetTeamQuery : IRequest<IReadOnlyList<TeamMemberResponse>>
{
    public long GarageId { get; set; }

    public DateOnly From { get; set; }

    public DateOnly To { get; set; }
}

public class GetTeamQueryValidator : AbstractValidator<GetTeamQuery>
{
    public GetTeamQueryValidator()
    {
        RuleFor(x => x.To).GreaterThanOrEqualTo(x => x.From).WithMessage("La période est invalide.");
        RuleFor(x => x).Must(x => x.To.DayNumber - x.From.DayNumber <= 366).WithMessage("La période ne peut pas dépasser un an.");
    }
}

public class GetTeamQueryHandler : IRequestHandler<GetTeamQuery, IReadOnlyList<TeamMemberResponse>>
{
    private readonly IEmployeeRepository _employees;
    private readonly IEmployeeScheduleRepository _schedules;
    private readonly IEmployeeAbsenceRepository _absences;
    private readonly ITenantContext _tenant;

    public GetTeamQueryHandler(
        IEmployeeRepository employees,
        IEmployeeScheduleRepository schedules,
        IEmployeeAbsenceRepository absences,
        ITenantContext tenant)
    {
        _employees = employees;
        _schedules = schedules;
        _absences = absences;
        _tenant = tenant;
    }

    public async Task<IReadOnlyList<TeamMemberResponse>> Handle(GetTeamQuery request, CancellationToken cancellationToken)
    {
        var employees = await _employees.GetActiveByGarageAsync(request.GarageId, cancellationToken);
        var ids = employees.Select(e => e.Id).ToList();

        var schedules = await _schedules.GetByEmployeesAsync(ids, cancellationToken);
        var absences = await _absences.GetByEmployeesAsync(
            ids,
            TeamRules.DayStartUtc(request.From, _tenant.TimeZone),
            TeamRules.DayStartUtc(request.To.AddDays(1), _tenant.TimeZone),
            cancellationToken);

        return employees
            .Select(e => new TeamMemberResponse
            {
                Id = e.Id,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Role = e.Role,
                Phone = e.Phone,
                Email = e.Email,
                Schedule = TeamRules.ToDays(schedules.Where(s => s.EmployeeId == e.Id)),
                Absences = absences.Where(a => a.EmployeeId == e.Id).Select(a => TeamRules.ToResponse(a, _tenant.TimeZone)).ToList(),
            })
            .ToList();
    }
}
