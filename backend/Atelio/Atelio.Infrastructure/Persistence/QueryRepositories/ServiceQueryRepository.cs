using Atelio.Application.Common;
using Atelio.Application.Features.Services.Repositories;
using Atelio.Application.Features.Services.Requests;
using Atelio.Application.Features.Services.Responses;
using Dapper;
using System.Data;
using System.Text;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class ServiceQueryRepository : IServiceQueryRepository
{
    private readonly IDbConnection _connection;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    // Service actif avec son prix et sa meilleure promotion en cours (@Today : jour local de la marque).
    private const string ServiceSelect = $"""
        SELECT
            s.id AS {nameof(ServiceResponse.Id)},
            s.code AS {nameof(ServiceResponse.Code)},
            s.name AS {nameof(ServiceResponse.Name)},
            s.description AS {nameof(ServiceResponse.Description)},
            s.duration_minutes AS {nameof(ServiceResponse.DurationMinutes)},
            s.uncertain_duration AS {nameof(ServiceResponse.UncertainDuration)},
            s.price AS {nameof(ServiceResponse.Price)},
            (SELECT MAX(p.discount_percent) FROM promotion p
             WHERE p.service_id = s.id AND p.is_active
               AND p.starts_on <= @Today AND (p.ends_on IS NULL OR p.ends_on >= @Today)) AS {nameof(ServiceResponse.DiscountPercent)}

        FROM service s

        WHERE s.is_active
        """;

    // Toutes les prestations avec leur type d'intervention (back-office).
    private const string AdminSelect = $"""
        SELECT
            s.id AS {nameof(ServiceAdminResponse.Id)},
            s.code AS {nameof(ServiceAdminResponse.Code)},
            s.name AS {nameof(ServiceAdminResponse.Name)},
            s.description AS {nameof(ServiceAdminResponse.Description)},
            s.duration_minutes AS {nameof(ServiceAdminResponse.DurationMinutes)},
            s.uncertain_duration AS {nameof(ServiceAdminResponse.UncertainDuration)},
            s.price AS {nameof(ServiceAdminResponse.Price)},
            (SELECT MAX(p.discount_percent) FROM promotion p
             WHERE p.service_id = s.id AND p.is_active
               AND p.starts_on <= @Today AND (p.ends_on IS NULL OR p.ends_on >= @Today)) AS {nameof(ServiceAdminResponse.DiscountPercent)},
            s.is_active AS {nameof(ServiceAdminResponse.IsActive)},
            s.category_id AS {nameof(ServiceAdminResponse.CategoryId)},
            c.name AS {nameof(ServiceAdminResponse.CategoryName)}

        FROM service s
        LEFT JOIN service_category c ON c.id = s.category_id

        ORDER BY s.name
        """;

    public ServiceQueryRepository(IDbConnection connection, ITenantContext tenant, TimeProvider clock)
    {
        _connection = connection;
        _tenant = tenant;
        _clock = clock;
    }

    private DateOnly Today() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(_clock.GetUtcNow().UtcDateTime, _tenant.TimeZone));

    public async Task<IReadOnlyList<ServiceResponse>> GetServicesAsync(
        ServicesRequestFilter filter,
        CancellationToken cancellationToken = default)
    {
        var sql = new StringBuilder(ServiceSelect);
        var parameters = new DynamicParameters();
        parameters.Add("Today", Today());

        if (filter.GarageId.HasValue)
        {
            sql.Append("""

                AND EXISTS (SELECT 1 FROM garage_service gs WHERE gs.service_id = s.id AND gs.garage_id = @GarageId)
                """);
            parameters.Add("GarageId", filter.GarageId.Value);
        }

        sql.Append("""

            ORDER BY s.name
            """);

        return (await _connection.QueryAsync<ServiceResponse>(
            new CommandDefinition(sql.ToString(), parameters, cancellationToken: cancellationToken))).ToList();
    }

    public async Task<IReadOnlyList<ServiceAdminResponse>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await _connection.QueryAsync<ServiceAdminResponse>(
            new CommandDefinition(AdminSelect, new { Today = Today() }, cancellationToken: cancellationToken))).ToList();

    public async Task<ServiceResponse?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        const string sql = $"""
            {ServiceSelect}
            AND s.code = @Code
            """;

        return await _connection.QuerySingleOrDefaultAsync<ServiceResponse>(
            new CommandDefinition(sql, new { Code = code.Trim().ToLower(), Today = Today() }, cancellationToken: cancellationToken));
    }
}
