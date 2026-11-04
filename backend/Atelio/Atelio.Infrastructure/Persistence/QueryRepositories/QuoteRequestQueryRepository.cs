using Atelio.Application.Features.QuoteRequests.Repositories;
using Atelio.Application.Features.QuoteRequests.Responses;
using Dapper;
using System.Data;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class QuoteRequestQueryRepository : IQuoteRequestQueryRepository
{
    private readonly IDbConnection _connection;

    private const string RequestSelect = $"""
        SELECT
            r.id AS {nameof(QuoteRequestResponse.Id)},
            r.created_at AS {nameof(QuoteRequestResponse.CreatedAt)},
            c.id AS {nameof(QuoteRequestResponse.CustomerId)},
            c.first_name AS {nameof(QuoteRequestResponse.CustomerFirstName)},
            c.last_name AS {nameof(QuoteRequestResponse.CustomerLastName)},
            c.email AS {nameof(QuoteRequestResponse.CustomerEmail)},
            c.phone AS {nameof(QuoteRequestResponse.CustomerPhone)},
            v.id AS {nameof(QuoteRequestResponse.VehicleId)},
            v.plate AS {nameof(QuoteRequestResponse.VehiclePlate)},
            (SELECT string_agg(s.name, ', ' ORDER BY s.name)
                FROM quote_request_service rs
                INNER JOIN service s ON s.id = rs.service_id
                WHERE rs.quote_request_id = r.id) AS {nameof(QuoteRequestResponse.Services)},
            r.message AS {nameof(QuoteRequestResponse.Message)},
            r.quote_id AS {nameof(QuoteRequestResponse.QuoteId)},
            q.number AS {nameof(QuoteRequestResponse.QuoteNumber)},
            q.sent_at AS {nameof(QuoteRequestResponse.QuoteSentAt)}

        FROM quote_request r
        INNER JOIN customer c ON c.id = r.customer_id
        INNER JOIN vehicle v ON v.id = r.vehicle_id
        LEFT JOIN quote q ON q.id = r.quote_id
        """;

    public QuoteRequestQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IReadOnlyList<QuoteRequestResponse>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await _connection.QueryAsync<QuoteRequestResponse>(
            new CommandDefinition(
                RequestSelect + "\nORDER BY r.quote_id IS NOT NULL, r.created_at DESC, r.id DESC",
                cancellationToken: cancellationToken))).ToList();

    public Task<QuoteRequestResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default) =>
        _connection.QuerySingleOrDefaultAsync<QuoteRequestResponse?>(
            new CommandDefinition(RequestSelect + "\nWHERE r.id = @Id", new { Id = id }, cancellationToken: cancellationToken));

    public Task<int> CountPendingAsync(CancellationToken cancellationToken = default) =>
        _connection.ExecuteScalarAsync<int>(
            new CommandDefinition("SELECT count(*)::int FROM quote_request WHERE quote_id IS NULL", cancellationToken: cancellationToken));
}
