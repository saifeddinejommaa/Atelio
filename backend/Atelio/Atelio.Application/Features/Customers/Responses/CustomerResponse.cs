using Atelio.Domain.Entities;

namespace Atelio.Application.Features.Customers.Responses;

public class CustomerResponse
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public bool IsActive { get; set; }

    public static CustomerResponse From(Customer customer) => new()
    {
        Id = customer.Id,
        FirstName = customer.FirstName,
        LastName = customer.LastName,
        Email = customer.Email,
        Phone = customer.Phone,
        IsActive = customer.IsActive,
    };
}
