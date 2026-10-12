using Atelio.Application.Common;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace Atelio.Infrastructure.Auth;

/// <summary>Jetons JWT (HS256) signés avec la clé CustomerAuth:SigningKey.</summary>
public class CustomerTokenService : ICustomerTokenService
{
    private static readonly TimeSpan SignupLifetime = TimeSpan.FromMinutes(15);

    private readonly CustomerAuthOptions _options;
    private readonly TimeProvider _clock;
    private readonly JsonWebTokenHandler _handler = new();

    public CustomerTokenService(IOptions<CustomerAuthOptions> options, TimeProvider clock)
    {
        _options = options.Value;
        _clock = clock;
    }

    /// <summary>Clé de signature, partagée avec la validation des jetons (Program.cs).</summary>
    public static SymmetricSecurityKey SigningKey(string secret)
    {
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
        {
            throw new InvalidOperationException("CustomerAuth:SigningKey doit contenir au moins 32 caractères.");
        }

        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    public (string Token, DateTime ExpiresAt) CreateSessionToken(long customerId, string tenant)
    {
        var expiresAt = _clock.GetUtcNow().UtcDateTime.AddDays(_options.SessionDays);
        var token = Create(CustomerClaims.SessionAudience, expiresAt, new Dictionary<string, object>
        {
            [CustomerClaims.CustomerId] = customerId.ToString(CultureInfo.InvariantCulture),
            [CustomerClaims.Tenant] = tenant,
        });

        return (token, expiresAt);
    }

    public string CreateSignupToken(string email, string tenant) =>
        Create(CustomerClaims.SignupAudience, _clock.GetUtcNow().UtcDateTime.Add(SignupLifetime), new Dictionary<string, object>
        {
            [CustomerClaims.Email] = email,
            [CustomerClaims.Tenant] = tenant,
        });

    public async Task<string?> ReadSignupTokenAsync(string token, string tenant)
    {
        var result = await _handler.ValidateTokenAsync(token, ValidationParameters(_options.SigningKey, CustomerClaims.SignupAudience));
        if (!result.IsValid
            || !result.Claims.TryGetValue(CustomerClaims.Tenant, out var claimTenant) || (string)claimTenant != tenant
            || !result.Claims.TryGetValue(CustomerClaims.Email, out var email))
        {
            return null;
        }

        return (string)email;
    }

    public string HashLoginCode(string email, string code)
    {
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(_options.SigningKey), Encoding.UTF8.GetBytes($"{email}:{code}"));
        return Convert.ToHexStringLower(hash);
    }

    /// <summary>Règles de validation d'un jeton (session ou inscription selon l'audience).</summary>
    public static TokenValidationParameters ValidationParameters(string secret, string audience) => new()
    {
        ValidIssuer = CustomerClaims.Issuer,
        ValidAudience = audience,
        IssuerSigningKey = SigningKey(secret),
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        ClockSkew = TimeSpan.FromMinutes(1),
        // Garde les noms des claims tels quels (cid, tenant, email).
        NameClaimType = CustomerClaims.CustomerId,
    };

    private string Create(string audience, DateTime expiresAt, Dictionary<string, object> claims) =>
        _handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = CustomerClaims.Issuer,
            Audience = audience,
            IssuedAt = _clock.GetUtcNow().UtcDateTime,
            NotBefore = _clock.GetUtcNow().UtcDateTime,
            Expires = expiresAt,
            Claims = claims,
            SigningCredentials = new SigningCredentials(SigningKey(_options.SigningKey), SecurityAlgorithms.HmacSha256),
        });
}
