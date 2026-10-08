using Atelio.Api.ApiResponse;
using Atelio.Infrastructure.Tenancy;

namespace Atelio.Api.Middleware;

/// <summary>
/// Sélectionne la base de la marque blanche à partir de l'en-tête X-Tenant
/// (ex. "X-Tenant: gmg"), envoyé par le site à chaque appel.
/// </summary>
public class TenantMiddleware
{
    public const string HeaderName = "X-Tenant";

    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, TenantContext tenant)
    {
        // Swagger et la santé de l'API ne dépendent d'aucune marque blanche.
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        var slug = context.Request.Headers[HeaderName].ToString();
        if (!tenant.TrySet(slug))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new ApiResponse<object?>(
                StatusCodes.Status400BadRequest,
                null,
                string.IsNullOrWhiteSpace(slug)
                    ? $"En-tête {HeaderName} manquant."
                    : $"Marque blanche « {slug} » inconnue."));
            return;
        }

        await _next(context);
    }
}
