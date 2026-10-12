using Atelio.Application.Features.Promotions.Responses;

namespace Atelio.Application.Features.Promotions.Repositories;

public interface IPromotionQueryRepository
{
    /// <summary>Promotions actives, sur des services actifs.</summary>
    Task<IReadOnlyList<PromotionResponse>> GetActivePromotionsAsync(
        CancellationToken cancellationToken = default);
}
