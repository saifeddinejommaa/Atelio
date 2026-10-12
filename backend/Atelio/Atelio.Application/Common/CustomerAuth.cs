namespace Atelio.Application.Common;

/// <summary>Configuration (appsettings « CustomerAuth ») de la connexion des clients du site b2c.</summary>
public class CustomerAuthOptions
{
    public const string SectionName = "CustomerAuth";

    /// <summary>Clé secrète (32 caractères minimum) : signe les jetons et les empreintes des codes.</summary>
    public string SigningKey { get; set; } = null!;

    /// <summary>Durée de la session du client.</summary>
    public int SessionDays { get; set; } = 30;
}

/// <summary>Jetons du client (session, inscription) et empreintes des codes de connexion.</summary>
public interface ICustomerTokenService
{
    /// <summary>Jeton de session du client pour cette marque, et sa date d'expiration (UTC).</summary>
    (string Token, DateTime ExpiresAt) CreateSessionToken(long customerId, string tenant);

    /// <summary>Jeton court (15 min) prouvant la possession de l'e-mail, pour créer le compte.</summary>
    string CreateSignupToken(string email, string tenant);

    /// <summary>E-mail d'un jeton d'inscription valide pour cette marque, sinon null.</summary>
    Task<string?> ReadSignupTokenAsync(string token, string tenant);

    /// <summary>Empreinte d'un code de connexion (HMAC de l'e-mail et du code).</summary>
    string HashLoginCode(string email, string code);
}

/// <summary>Envoi d'e-mails (console en développement ; fournisseur à brancher).</summary>
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
}

/// <summary>Noms des claims du jeton de session du client.</summary>
public static class CustomerClaims
{
    public const string CustomerId = "cid";

    public const string Tenant = "tenant";

    public const string Email = "email";

    /// <summary>Audience des jetons de session (les jetons d'inscription ont la leur).</summary>
    public const string SessionAudience = "atelio-customer";

    public const string SignupAudience = "atelio-signup";

    public const string Issuer = "atelio-api";
}
