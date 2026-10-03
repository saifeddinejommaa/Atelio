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

    public static bool IsValidPlate(string? plate) =>
        plate is not null
        && System.Text.RegularExpressions.Regex.IsMatch(plate.Trim(), "^[A-Za-z]{2}-?[0-9]{3}-?[A-Za-z]{2}$");
}
