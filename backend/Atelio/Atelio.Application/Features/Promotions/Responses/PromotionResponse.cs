using Atelio.Domain;

namespace Atelio.Application.Features.Promotions.Responses;

public class PromotionResponse
{
    public long Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    // Ex. 20 pour -20 %.
    public decimal DiscountPercent { get; set; }

    // Période d'affichage (jours locaux, bornes incluses) ; pas de fin : sans limite.
    public DateOnly StartsOn { get; set; }

    public DateOnly? EndsOn { get; set; }

    public string? Conditions { get; set; }

    public bool IsActive { get; set; }

    public long ServiceId { get; set; }

    public string ServiceCode { get; set; } = null!;

    public string ServiceName { get; set; } = null!;

    // Prix TTC du service avant remise.
    public decimal ServicePrice { get; set; }

    // Prix TTC du service avec cette remise.
    public decimal DiscountedPrice => Pricing.ApplyDiscount(ServicePrice, DiscountPercent);
}
