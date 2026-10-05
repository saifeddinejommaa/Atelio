namespace Atelio.Application.Common;

public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> action,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Marque blanche de la requête en cours (résolue depuis l'en-tête X-Tenant).
/// Chaque marque blanche a sa propre base de données.
/// </summary>
public interface ITenantContext
{
    string Slug { get; }

    /// <summary>Fuseau horaire des garages de la marque (heures d'ouverture, créneaux).</summary>
    TimeZoneInfo TimeZone { get; }
}

public static class TextRules
{
    // Texte facultatif : vide => null.
    public static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>Normalise une immatriculation : "ab123cd" => "AB-123-CD".</summary>
    public static string NormalizePlate(string plate)
    {
        var raw = new string(plate.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
        return raw.Length == 7 ? $"{raw[..2]}-{raw[2..5]}-{raw[5..]}" : plate.Trim().ToUpperInvariant();
    }

    /// <summary>
    /// Clé de recherche d'un numéro de téléphone : ses 9 derniers chiffres, quel que soit le format
    /// ("06 12 34 56 78", "+33 6 12 34 56 78" et "0612345678" donnent "612345678"). Null si trop court.
    /// </summary>
    public static string? PhoneKey(string? phone)
    {
        var digits = new string((phone ?? "").Where(char.IsDigit).ToArray());
        return digits.Length >= 9 ? digits[^9..] : null;
    }

    public static bool IsValidPlate(string? plate) =>
        plate is not null
        && System.Text.RegularExpressions.Regex.IsMatch(plate.Trim(), "^[A-Za-z]{2}-?[0-9]{3}-?[A-Za-z]{2}$");
}
