using Atelio.Application.Features.Quotes.Repositories;
using Atelio.Application.Features.Quotes.Responses;
using Dapper;
using System.Data;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class QuoteQueryRepository : IQuoteQueryRepository
{
    private readonly IDbConnection _connection;

    private const string QuoteSelect = $"""
        SELECT
            q.id AS {nameof(QuoteResponse.Id)},
            q.number AS {nameof(QuoteResponse.Number)},
            q.created_at AS {nameof(QuoteResponse.CreatedAt)},
            q.total_ht AS {nameof(QuoteResponse.TotalHt)},
            q.total_vat AS {nameof(QuoteResponse.TotalVat)},
            q.total_ttc AS {nameof(QuoteResponse.TotalTtc)},
            c.id AS {nameof(QuoteResponse.CustomerId)},
            c.first_name AS {nameof(QuoteResponse.CustomerFirstName)},
            c.last_name AS {nameof(QuoteResponse.CustomerLastName)},
            c.email AS {nameof(QuoteResponse.CustomerEmail)},
            c.phone AS {nameof(QuoteResponse.CustomerPhone)},
            v.plate AS {nameof(QuoteResponse.VehiclePlate)},
            v.make AS {nameof(QuoteResponse.VehicleMake)},
            v.model AS {nameof(QuoteResponse.VehicleModel)},
            v.version AS {nameof(QuoteResponse.VehicleVersion)},
            g.name AS {nameof(QuoteResponse.GarageName)},
            g.address_line || ', ' || g.postal_code || ' ' || g.city AS {nameof(QuoteResponse.GarageAddress)},
            g.phone AS {nameof(QuoteResponse.GaragePhone)}

        FROM quote q
        INNER JOIN customer c ON c.id = q.customer_id
        INNER JOIN vehicle v ON v.id = q.vehicle_id
        INNER JOIN garage g ON g.id = q.garage_id

        WHERE q.id = @Id
        """;

    private const string LinesSelect = $"""
        SELECT
            l.name AS {nameof(QuoteLineResponse.Name)},
            l.description AS {nameof(QuoteLineResponse.Description)},
            l.quantity AS {nameof(QuoteLineResponse.Quantity)},
            l.unit_price_ht AS {nameof(QuoteLineResponse.UnitPriceHt)},
            l.total AS {nameof(QuoteLineResponse.Total)}

        FROM quote_line l

        WHERE l.quote_id = @Id

        ORDER BY l.sort_order, l.id
        """;

    private const string ByCustomerSelect = $"""
        SELECT
            q.id AS {nameof(QuoteSummaryResponse.Id)},
            q.number AS {nameof(QuoteSummaryResponse.Number)},
            q.created_at AS {nameof(QuoteSummaryResponse.CreatedAt)},
            q.total_ht AS {nameof(QuoteSummaryResponse.TotalHt)},
            q.total_ttc AS {nameof(QuoteSummaryResponse.TotalTtc)},
            v.plate AS {nameof(QuoteSummaryResponse.VehiclePlate)},
            g.name AS {nameof(QuoteSummaryResponse.GarageName)}

        FROM quote q
        INNER JOIN vehicle v ON v.id = q.vehicle_id
        INNER JOIN garage g ON g.id = q.garage_id

        WHERE q.customer_id = @CustomerId

        ORDER BY q.created_at DESC, q.id DESC
        """;

    public QuoteQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<QuoteResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var quote = await _connection.QuerySingleOrDefaultAsync<QuoteResponse>(
            new CommandDefinition(QuoteSelect, new { Id = id }, cancellationToken: cancellationToken));
        if (quote is null)
        {
            return null;
        }

        quote.Lines = (await _connection.QueryAsync<QuoteLineResponse>(
            new CommandDefinition(LinesSelect, new { Id = id }, cancellationToken: cancellationToken))).ToList();

        return quote;
    }

    public async Task<IReadOnlyList<QuoteSummaryResponse>> GetByCustomerAsync(long customerId, CancellationToken cancellationToken = default) =>
        (await _connection.QueryAsync<QuoteSummaryResponse>(
            new CommandDefinition(ByCustomerSelect, new { CustomerId = customerId }, cancellationToken: cancellationToken))).ToList();
}
