using Atelio.Domain;

namespace Atelio.Application.Features.Services.Responses;

public class ServiceResponse
{
    public long Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public int DurationMinutes { get; set; }

    // Durée incertaine (ex. « Autre ») : à placer de préférence le matin.
    public bool UncertainDuration { get; set; }

    // Prix TTC du service, avant promotion.
    public decimal Price { get; set; }

    // Meilleure remise active sur le service (ex. 20 pour -20 %), null si aucune.
    public decimal? DiscountPercent { get; set; }

    // Prix TTC après promotion (égal au prix s'il n'y a pas de promotion).
    public decimal FinalPrice => Pricing.ApplyDiscount(Price, DiscountPercent);
}

/// <summary>Prestation dans le back-office : active ou non, avec son type d'intervention.</summary>
public class ServiceAdminResponse : ServiceResponse
{
    public bool IsActive { get; set; }

    public long? CategoryId { get; set; }

    public string? CategoryName { get; set; }
}
