using Atelio.Application.Common;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Atelio.Infrastructure.Tenancy;

/// <summary>Configuration (appsettings) : serveur PostgreSQL commun et liste des marques blanches.</summary>
public class TenancyOptions
{
    public const string SectionName = "Tenancy";

    /// <summary>Connexion au serveur, sans base (Host, Port, Username, Password).</summary>
    public string ServerConnection { get; set; } = null!;

    public List<TenantSettings> Tenants { get; set; } = [];
}

public class TenantSettings
{
    /// <summary>Identifiant envoyé par le site dans l'en-tête X-Tenant (ex. "gmg").</summary>
    public string Slug { get; set; } = null!;

    /// <summary>Nom de la base de la marque blanche (ex. "atelio_garage_dupont").</summary>
    public string Database { get; set; } = null!;

    public string TimeZone { get; set; } = "Europe/Paris";
}

/// <summary>
/// Marque blanche de la requête en cours. Renseignée par le middleware de l'API
/// avant tout accès à la base.
/// </summary>
public class TenantContext : ITenantContext
{
    private readonly TenancyOptions _options;
    private TenantSettings? _tenant;

    public TenantContext(IOptions<TenancyOptions> options)
    {
        _options = options.Value;
    }

    public bool IsResolved => _tenant is not null;

    public string Slug => Current.Slug;

    public TimeZoneInfo TimeZone => TimeZoneInfo.FindSystemTimeZoneById(Current.TimeZone);

    /// <summary>Chaîne de connexion vers la base de la marque blanche.</summary>
    public string ConnectionString =>
        new NpgsqlConnectionStringBuilder(_options.ServerConnection) { Database = Current.Database }.ConnectionString;

    /// <summary>Sélectionne la marque blanche. Renvoie false si elle n'est pas configurée.</summary>
    public bool TrySet(string? slug)
    {
        _tenant = _options.Tenants.FirstOrDefault(t => string.Equals(t.Slug, slug, StringComparison.OrdinalIgnoreCase));
        return _tenant is not null;
    }

    private TenantSettings Current =>
        _tenant ?? throw new InvalidOperationException("Marque blanche non résolue pour cette requête (en-tête X-Tenant manquant).");
}
