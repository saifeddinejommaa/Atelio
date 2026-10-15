using Atelio.Application.Common;
using Atelio.Application.Features.Promotions.Repositories;
using Atelio.Application.Features.Promotions.Responses;
using Dapper;
using System.Data;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class PromotionQueryRepository : IPromotionQueryRepository
{
    private readonly IDbConnection _connection;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    // Promotion et sa prestation (filtres et tri ajoutés à la suite).
    private const string Select = $"""
        SELECT
            p.id AS {nameof(PromotionResponse.Id)},
            p.title AS {nameof(PromotionResponse.Title)},
            p.description AS {nameof(PromotionResponse.Description)},
            p.discount_percent AS {nameof(PromotionResponse.DiscountPercent)},
            p.starts_on AS {nameof(PromotionResponse.StartsOn)},
            p.ends_on AS {nameof(PromotionResponse.EndsOn)},
            p.conditions AS {nameof(PromotionResponse.Conditions)},
            p.is_active AS {nameof(PromotionResponse.IsActive)},
            s.id AS {nameof(PromotionResponse.ServiceId)},
            s.code AS {nameof(PromotionResponse.ServiceCode)},
            s.name AS {nameof(PromotionResponse.ServiceName)},
            s.price AS {nameof(PromotionResponse.ServicePrice)}

        FROM promotion p
        INNER JOIN service s ON s.id = p.service_id
        """;

    public PromotionQueryRepository(IDbConnection connection, ITenantContext tenant, TimeProvider clock)
    {
        _connection = connection;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<IReadOnlyList<PromotionResponse>> GetActivePromotionsAsync(CancellationToken cancellationToken = default)
    {
        // Aujourd'hui, jour local de la marque.
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(_clock.GetUtcNow().UtcDateTime, _tenant.TimeZone));

        return (await _connection.QueryAsync<PromotionResponse>(
            new CommandDefinition(
                $"""
                {Select}

                WHERE p.is_active
                  AND s.is_active
                  AND p.starts_on <= @Today
                  AND (p.ends_on IS NULL OR p.ends_on >= @Today)

                ORDER BY p.ends_on NULLS LAST, p.created_at DESC
                """,
                new { Today = today },
                cancellationToken: cancellationToken))).ToList();
    }

    public async Task<IReadOnlyList<PromotionResponse>> GetAllAsync(CancellationToken cancellationToken = default) =>
        (await _connection.QueryAsync<PromotionResponse>(
            new CommandDefinition($"{Select}\n\nORDER BY p.starts_on DESC, p.id DESC", cancellationToken: cancellationToken))).ToList();
}
