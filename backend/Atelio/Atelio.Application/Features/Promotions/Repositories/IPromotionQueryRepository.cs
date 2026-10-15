using Atelio.Application.Features.Promotions.Responses;

namespace Atelio.Application.Features.Promotions.Repositories;

public interface IPromotionQueryRepository
{
    /// <summary>Promotions affichées aujourd'hui sur le site : actives, dans leur période, sur des services actifs.</summary>
    Task<IReadOnlyList<PromotionResponse>> GetActivePromotionsAsync(
        CancellationToken cancellationToken = default);

    /// <summary>Toutes les promotions (back-office), les plus récentes d'abord.</summary>
    Task<IReadOnlyList<PromotionResponse>> GetAllAsync(CancellationToken cancellationToken = default);
}
