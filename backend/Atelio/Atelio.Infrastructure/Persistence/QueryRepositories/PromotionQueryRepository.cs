using Atelio.Application.Features.Promotions.Repositories;
using Atelio.Application.Features.Promotions.Responses;
using Dapper;
using System.Data;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class PromotionQueryRepository : IPromotionQueryRepository
{
    private readonly IDbConnection _connection;

    public PromotionQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IReadOnlyList<PromotionResponse>> GetActivePromotionsAsync(CancellationToken cancellationToken = default)
    {
        const string sql = $"""
            SELECT
                p.id AS {nameof(PromotionResponse.Id)},
                p.title AS {nameof(PromotionResponse.Title)},
                p.description AS {nameof(PromotionResponse.Description)},
                p.discount_percent AS {nameof(PromotionResponse.DiscountPercent)},
                s.id AS {nameof(PromotionResponse.ServiceId)},
                s.code AS {nameof(PromotionResponse.ServiceCode)},
                s.name AS {nameof(PromotionResponse.ServiceName)},
                s.price AS {nameof(PromotionResponse.ServicePrice)}

            FROM promotion p
            INNER JOIN service s ON s.id = p.service_id

            WHERE p.is_active
              AND s.is_active

            ORDER BY p.created_at DESC
            """;

        return (await _connection.QueryAsync<PromotionResponse>(
            new CommandDefinition(sql, cancellationToken: cancellationToken))).ToList();
    }
}
