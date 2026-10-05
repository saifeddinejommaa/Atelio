using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IEmployeeRepository : IRepository<Employee>
{
    /// <summary>Mécaniciens actifs du garage, par nom.</summary>
    Task<IReadOnlyList<Employee>> GetActiveMechanicsAsync(long garageId, CancellationToken cancellationToken = default);

    /// <summary>Employés actifs du garage (tous rôles), par nom.</summary>
    Task<IReadOnlyList<Employee>> GetActiveByGarageAsync(long garageId, CancellationToken cancellationToken = default);
}

public interface IEmployeeScheduleRepository : IRepository<EmployeeSchedule>
{
    /// <summary>Plages du planning type de ces employés.</summary>
    Task<IReadOnlyList<EmployeeSchedule>> GetByEmployeesAsync(IReadOnlyCollection<long> employeeIds, CancellationToken cancellationToken = default);
}

public interface IEmployeeAbsenceRepository : IRepository<EmployeeAbsence>
{
    /// <summary>Absences de ces employés qui chevauchent la période (UTC).</summary>
    Task<IReadOnlyList<EmployeeAbsence>> GetByEmployeesAsync(
        IReadOnlyCollection<long> employeeIds, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default);
}
