using Atelio.Domain.Entities;

namespace Atelio.Application.Features.Services.Responses;

public class ServiceCategoryResponse
{
    public long Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    // € TTC par heure.
    public decimal HourlyRate { get; set; }

    public static ServiceCategoryResponse From(ServiceCategory category) => new()
    {
        Id = category.Id,
        Code = category.Code,
        Name = category.Name,
        HourlyRate = category.HourlyRate,
    };
}
