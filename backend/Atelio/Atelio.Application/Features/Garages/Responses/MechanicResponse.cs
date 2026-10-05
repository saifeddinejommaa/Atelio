using Atelio.Domain.Entities;

namespace Atelio.Application.Features.Garages.Responses;

public class MechanicResponse
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public static MechanicResponse From(Employee employee) => new()
    {
        Id = employee.Id,
        FirstName = employee.FirstName,
        LastName = employee.LastName,
    };
}
