using Atelio.Application.Common;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Atelio.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Authorization;

namespace Atelio.Api.Middleware;

/// <summary>Configuration (appsettings « EntraId ») : comptes Microsoft du personnel (tenant Gustaya).</summary>
public class EntraIdOptions
{
    public const string SectionName = "EntraId";

    public string Instance { get; set; } = "https://login.microsoftonline.com/";

    /// <summary>Identifiant du tenant Gustaya.</summary>
    public string TenantId { get; set; } = null!;

    /// <summary>Identifiant (client id) de l'inscription d'application de l'API : audience des jetons.</summary>
    public string ApiClientId { get; set; } = null!;
}

/// <summary>
/// Personnel du back-office : jeton Microsoft Entra (tenant Gustaya) avec le rôle d'application « Admin » ou « Staff »,
/// et employé actif de la marque de la requête (en-tête X-Tenant), relié par l'identifiant Microsoft ou,
/// à la 1re connexion, par l'e-mail. Admin et Staff ont pour l'instant les mêmes droits.
/// </summary>
public static class StaffAuth
{
    public const string Scheme = "Staff";

    public const string Policy = "Staff";

    /// <summary>Rôles d'application déclarés sur l'inscription de l'API (claim « roles » du jeton).</summary>
    public const string AdminRole = "Admin";

    public const string StaffRole = "Staff";

    private const string EmployeeKey = "atelio.staff";

    public static void AddPolicies(AuthorizationOptions options)
    {
        options.AddPolicy(Policy, p => p
            .AddAuthenticationSchemes(Scheme)
            .RequireAuthenticatedUser()
            .RequireRole(AdminRole, StaffRole)
            .AddRequirements(new BrandEmployeeRequirement()));

        // Sans attribut, une route est réservée au personnel : seules les routes du site b2c sont [AllowAnonymous].
        options.FallbackPolicy = options.GetPolicy(Policy);
    }

    /// <summary>Employé connecté (résolu par l'autorisation), ou null.</summary>
    public static Employee? CurrentEmployee(this HttpContext http) => http.Items[EmployeeKey] as Employee;

    /// <summary>Rôle d'application du compte connecté : Admin ou Staff.</summary>
    public static string CurrentRole(this HttpContext http) => http.User.IsInRole(AdminRole) ? AdminRole : StaffRole;

    /// <summary>
    /// Employé de la marque relié au compte Microsoft : par son identifiant (oid), sinon, à la 1re connexion,
    /// l'employé actif non relié qui a le même e-mail (l'oid est alors enregistré).
    /// </summary>
    internal static async Task<Employee?> ResolveAsync(HttpContext http)
    {
        if (http.Items.TryGetValue(EmployeeKey, out var cached))
        {
            return cached as Employee;
        }

        var tenant = http.RequestServices.GetRequiredService<TenantContext>();
        var objectId = http.User.FindFirst("oid")?.Value;
        if (!tenant.IsResolved || string.IsNullOrEmpty(objectId))
        {
            return null;
        }

        var employees = http.RequestServices.GetRequiredService<IEmployeeRepository>();
        var employee = await employees.GetByEntraObjectIdAsync(objectId, http.RequestAborted);

        if (employee is null)
        {
            // Invité : « email » (claim facultatif à ajouter dans Entra) ou son e-mail de connexion.
            var email = http.User.FindFirst("email")?.Value ?? http.User.FindFirst("preferred_username")?.Value;
            if (!string.IsNullOrWhiteSpace(email))
            {
                employee = await employees.GetUnlinkedByEmailAsync(email, http.RequestAborted);
                if (employee is not null)
                {
                    employee.EntraObjectId = objectId;
                    await http.RequestServices.GetRequiredService<IUnitOfWork>().SaveChangesAsync(http.RequestAborted);
                }
            }
        }

        if (employee is not { IsActive: true })
        {
            employee = null;
        }

        http.Items[EmployeeKey] = employee;
        return employee;
    }
}

/// <summary>Le compte connecté est un employé actif de la marque de la requête.</summary>
public class BrandEmployeeRequirement : IAuthorizationRequirement;

public class BrandEmployeeAuthorizationHandler : AuthorizationHandler<BrandEmployeeRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, BrandEmployeeRequirement requirement)
    {
        if (context.Resource is HttpContext http
            && context.User.Identity?.IsAuthenticated == true
            && await StaffAuth.ResolveAsync(http) is not null)
        {
            context.Succeed(requirement);
        }
    }
}
