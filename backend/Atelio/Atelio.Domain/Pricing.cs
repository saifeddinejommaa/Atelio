namespace Atelio.Domain;

public static class Pricing
{
    /// <summary>Prix après remise en %, arrondi au centime (ex. 89 € à -20 % => 71,20 €).</summary>
    public static decimal ApplyDiscount(decimal price, decimal? discountPercent) =>
        discountPercent is decimal percent
            ? Math.Round(price * (1 - percent / 100m), 2, MidpointRounding.AwayFromZero)
            : price;

    /// <summary>Total d'une ligne : quantité × prix unitaire, arrondi au centime, remise déduite.</summary>
    public static decimal LineTotal(decimal quantity, decimal unitPrice, decimal? discountPercent) =>
        ApplyDiscount(Math.Round(quantity * unitPrice, 2, MidpointRounding.AwayFromZero), discountPercent);

    /// <summary>Main-d'œuvre TTC : taux horaire × temps, arrondi au centime (ex. 55 €/h × 45 min => 41,25 €).</summary>
    public static decimal Labour(decimal hourlyRate, int minutes) =>
        Math.Round(hourlyRate * minutes / 60m, 2, MidpointRounding.AwayFromZero);
}
