using Atelio.Application.Common;
using Atelio.Application.Features.Appointments.Commands;
using Atelio.Application.Features.Appointments.Responses;
using Atelio.Domain.Repositories;
using MediatR;

namespace Atelio.Application.Features.Appointments.Queries;

/// <summary>Avant de lancer un rendez-vous à une heure donnée : mécanicien libre, fin estimée, ou raison (non bloquante).</summary>
public class GetAppointmentStartCheckQuery : IRequest<StartCheckResponse>
{
    public string Reference { get; set; } = null!;

    // Début réel, heure locale du garage. Par défaut : maintenant.
    public DateTime? StartAt { get; set; }
}

public class GetAppointmentStartCheckQueryHandler : IRequestHandler<GetAppointmentStartCheckQuery, StartCheckResponse>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IServiceRepository _services;
    private readonly IGarageRepository _garages;
    private readonly IPlanningRepository _planning;
    private readonly IEmployeeRepository _employees;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public GetAppointmentStartCheckQueryHandler(
        IAppointmentRepository appointments,
        IServiceRepository services,
        IGarageRepository garages,
        IPlanningRepository planning,
        IEmployeeRepository employees,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _appointments = appointments;
        _services = services;
        _garages = garages;
        _planning = planning;
        _employees = employees;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<StartCheckResponse> Handle(GetAppointmentStartCheckQuery request, CancellationToken cancellationToken)
    {
        var appointment = await GarageAppointmentRules.GetOpenAsync(_appointments, request.Reference, cancellationToken);
        var start = await GarageAppointmentRules.EvaluateStartAsync(
            appointment, request.StartAt, _services, _garages, _planning, _tenant, _clock.GetUtcNow().UtcDateTime, cancellationToken);

        var employee = start.Placement.EmployeeId is long id ? await _employees.GetByIdAsync(id, cancellationToken) : null;

        return new StartCheckResponse
        {
            Possible = start.Placement.Available,
            Message = start.Placement.Reason,
            StartAt = start.StartUtc,
            EstimatedEndAt = start.EndUtc,
            EmployeeId = employee?.Id,
            EmployeeName = employee is null ? null : $"{employee.FirstName} {employee.LastName}",
        };
    }
}
