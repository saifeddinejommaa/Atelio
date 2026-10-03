namespace Atelio.Domain;

public static class Pricing
{
    /// <summary>Prix après remise en %, arrondi au centime (ex. 89 € à -20 % => 71,20 €).</summary>
    public static decimal ApplyDiscount(decimal price, decimal? discountPercent) =>
        discountPercent is decimal percent
            ? Math.Round(price * (1 - percent / 100m), 2, MidpointRounding.AwayFromZero)
            : price;
}
