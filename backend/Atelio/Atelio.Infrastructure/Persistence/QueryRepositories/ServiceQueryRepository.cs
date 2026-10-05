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

    // Service actif avec son prix et sa meilleure promotion active.
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
             WHERE p.service_id = s.id AND p.is_active) AS {nameof(ServiceResponse.DiscountPercent)}

        FROM service s

        WHERE s.is_active
        """;

    public ServiceQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IReadOnlyList<ServiceResponse>> GetServicesAsync(
        ServicesRequestFilter filter,
        CancellationToken cancellationToken = default)
    {
        var sql = new StringBuilder(ServiceSelect);
        var parameters = new DynamicParameters();

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

    public async Task<ServiceResponse?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        const string sql = $"""
            {ServiceSelect}
            AND s.code = @Code
            """;

        return await _connection.QuerySingleOrDefaultAsync<ServiceResponse>(
            new CommandDefinition(sql, new { Code = code.Trim().ToLower() }, cancellationToken: cancellationToken));
    }
}
