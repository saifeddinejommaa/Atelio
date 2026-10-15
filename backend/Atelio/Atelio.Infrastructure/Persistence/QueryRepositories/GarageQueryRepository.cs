using Atelio.Application.Features.Garages.Repositories;
using Atelio.Application.Features.Garages.Requests;
using Atelio.Application.Features.Garages.Responses;
using Dapper;
using System.Data;
using System.Text;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class GarageQueryRepository : IGarageQueryRepository
{
    private readonly IDbConnection _connection;

    // Garage actif avec les codes des services actifs qu'il réalise.
    private const string GarageSelect = $"""
        SELECT
            g.id AS {nameof(GarageResponse.Id)},
            g.name AS {nameof(GarageResponse.Name)},
            g.address_line AS {nameof(GarageResponse.AddressLine)},
            g.postal_code AS {nameof(GarageResponse.PostalCode)},
            g.city AS {nameof(GarageResponse.City)},
            g.country AS {nameof(GarageResponse.Country)},
            g.latitude AS {nameof(GarageResponse.Latitude)},
            g.longitude AS {nameof(GarageResponse.Longitude)},
            g.phone AS {nameof(GarageResponse.Phone)},
            g.email AS {nameof(GarageResponse.Email)},
            to_char(g.opening_time, 'HH24:MI') AS {nameof(GarageResponse.OpeningTime)},
            to_char(g.closing_time, 'HH24:MI') AS {nameof(GarageResponse.ClosingTime)},
            g.open_days AS {nameof(GarageResponse.OpenDays)},
            COALESCE(
                ARRAY(
                    SELECT s.code FROM garage_service gs
                    INNER JOIN service s ON s.id = gs.service_id AND s.is_active
                    WHERE gs.garage_id = g.id
                    ORDER BY s.name),
                ARRAY[]::text[]) AS {nameof(GarageResponse.ServiceCodes)}

        FROM garage g

        WHERE g.is_active
        """;

    public GarageQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IReadOnlyList<GarageResponse>> GetGaragesAsync(
        GaragesRequestFilter filter,
        CancellationToken cancellationToken = default)
    {
        var sql = new StringBuilder(GarageSelect);
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            sql.Append("""

                AND (
                    g.city ILIKE @Search
                    OR g.postal_code ILIKE @Search
                    OR g.address_line ILIKE @Search
                    OR g.name ILIKE @Search
                )
                """);
            parameters.Add("Search", $"%{filter.Search.Trim()}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.ServiceCode))
        {
            sql.Append("""

                AND EXISTS (
                    SELECT 1 FROM garage_service gs
                    INNER JOIN service s ON s.id = gs.service_id
                    WHERE gs.garage_id = g.id AND s.code = @ServiceCode AND s.is_active
                )
                """);
            parameters.Add("ServiceCode", filter.ServiceCode.Trim().ToLower());
        }

        sql.Append("""

            ORDER BY g.city, g.name
            """);

        return (await _connection.QueryAsync<GarageResponse>(
            new CommandDefinition(sql.ToString(), parameters, cancellationToken: cancellationToken))).ToList();
    }

    public async Task<GarageResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        const string sql = $"""
            {GarageSelect}
            AND g.id = @Id
            """;

        return await _connection.QuerySingleOrDefaultAsync<GarageResponse>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: cancellationToken));
    }
}
