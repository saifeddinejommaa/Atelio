using Atelio.Infrastructure.Tenancy;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using System.Data;

namespace Atelio.Infrastructure;

public static class InfrastructureServicesConfiguration
{
    public static IServiceCollection ConfigureInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<TenancyOptions>(configuration.GetSection(TenancyOptions.SectionName));

        // EF Core et Dapper se connectent à la base de la marque blanche de la requête.
        services.AddDbContext<AtelioDbContext>((provider, options) =>
            options.UseNpgsql(provider.GetRequiredService<TenantContext>().ConnectionString));

        services.AddScoped<IDbConnection>(provider =>
            new NpgsqlConnection(provider.GetRequiredService<TenantContext>().ConnectionString));

        // Colonnes snake_case => propriétés PascalCase quand un alias manque.
        DefaultTypeMap.MatchNamesWithUnderscores = true;

        services.AddSingleton(TimeProvider.System);

        return services;
    }
}
