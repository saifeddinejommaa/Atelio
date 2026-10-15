using Atelio.Application.Common;
using Atelio.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Authorization;

namespace Atelio.Api.Middleware;

/// <summary>
/// Client connecté du site b2c : jeton de session valide, émis pour la marque de la requête (en-tête X-Tenant).
/// Un jeton d'une marque ne donne aucun accès aux autres.
/// </summary>
public static class CustomerAuthPolicy
{
    public const string Name = "Customer";

    /// <summary>Schéma d'authentification : jeton émis par /api/auth/customer.</summary>
    public const string Scheme = "Customer";

    public static void Configure(AuthorizationPolicyBuilder policy) =>
        policy
            .AddAuthenticationSchemes(Scheme)
            .RequireAuthenticatedUser()
            .RequireClaim(CustomerClaims.CustomerId)
            .RequireAssertion(context =>
                context.Resource is HttpContext http
                && http.RequestServices.GetRequiredService<TenantContext>() is { IsResolved: true } tenant
                && context.User.HasClaim(CustomerClaims.Tenant, tenant.Slug));
}
