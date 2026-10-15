namespace Atelio.Application.Common;

/// <summary>
/// Identité légale de la marque, imprimée sur ses documents (configuration Tenancy:Tenants:n:Legal).
/// Même contenu que la charte du front (core/data/brands).
/// </summary>
public class TenantLegal
{
    // Nom commercial (ex. « GMG78 »).
    public string BrandName { get; set; } = null!;

    public string CompanyName { get; set; } = null!;

    public string Address { get; set; } = null!;

    public string Siret { get; set; } = null!;

    public string VatNumber { get; set; } = null!;

    public string Capital { get; set; } = null!;

    public string Rcs { get; set; } = null!;

    // Logo SVG, relatif au dossier de l'API (ex. Assets/Brands/gmg/logo.svg). Facultatif.
    public string? LogoFile { get; set; }
}

/// <summary>Contenu d'un PDF de facture : tout ce qui est imprimé, figé au moment de la génération.</summary>
public record InvoicePdfModel(
    TenantLegal Legal,
    string Number,
    DateTime IssuedAtLocal,
    DateOnly? DueDate,
    int Version,
    string GarageName,
    string GarageAddress,
    string? GaragePhone,
    string CustomerName,
    string? CustomerPhone,
    string? CustomerEmail,
    string VehiclePlate,
    string? VehicleDescription,
    int? Mileage,
    // true : prix HT (articles) ; false : anciennes factures en TTC (main-d'œuvre, pièces).
    bool PricesExcludingVat,
    IReadOnlyList<InvoicePdfLine> Lines,
    decimal TotalHt,
    decimal TotalVat,
    decimal TotalTtc,
    decimal VatRate,
    IReadOnlyList<InvoicePdfPayment> Payments,
    decimal AmountPaid,
    decimal Remaining);

// Total : remise de la promotion déduite (DiscountLabel / DiscountPercent, sinon null).
public record InvoicePdfLine(
    string Label, string? Description, decimal Quantity, decimal UnitPrice, string? DiscountLabel, decimal? DiscountPercent, decimal Total);

public record InvoicePdfPayment(DateTime PaidAtLocal, string Method, decimal Amount);

/// <summary>Mise en page PDF d'une facture.</summary>
public interface IInvoicePdfRenderer
{
    byte[] Render(InvoicePdfModel invoice);
}

/// <summary>
/// Stockage des documents (Azure Blob Storage ; Azurite en local) : un conteneur par marque blanche
/// (ex. « gmg »), des dossiers par type de document (ex. invoices/2026/F-2026-000052-v1.pdf).
/// </summary>
public interface IDocumentStorage
{
    /// <summary>Enregistre le fichier. Refuse d'écraser un fichier existant (un document émis ne change plus).</summary>
    Task UploadAsync(string container, string path, byte[] content, string contentType, CancellationToken cancellationToken = default);

    /// <summary>Contenu du fichier, ou null s'il n'existe pas.</summary>
    Task<Stream?> OpenAsync(string container, string path, CancellationToken cancellationToken = default);
}

public static class DocumentContainers
{
    /// <summary>
    /// Conteneur de la marque blanche : son identifiant en minuscules (ex. « gmg »).
    /// Azure exige 3 à 63 caractères : lettres minuscules, chiffres et tirets.
    /// </summary>
    public static string For(ITenantContext tenant) => tenant.Slug.ToLowerInvariant();
}
