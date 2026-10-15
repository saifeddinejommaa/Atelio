namespace Atelio.Application.Features.Interventions.Requests;

public class InterventionArticleRequest
{
    // Article du catalogue (ignoré en modification : seule la quantité change).
    public long ArticleId { get; set; }

    public decimal Quantity { get; set; }

    // Promotion en cours appliquée à la ligne, sinon null.
    public long? PromotionId { get; set; }
}
