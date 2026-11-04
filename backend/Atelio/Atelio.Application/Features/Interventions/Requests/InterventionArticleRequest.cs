namespace Atelio.Application.Features.Interventions.Requests;

public class InterventionArticleRequest
{
    // Modification d'une ligne : prix HT propre à cette intervention (le catalogue ne change pas). Absent : elle garde le sien.
    public decimal? UnitPriceHt { get; set; }

    // Article du catalogue (ignoré en modification : seule la quantité change).
    public long ArticleId { get; set; }

    public decimal Quantity { get; set; }

    // Promotion en cours appliquée à la ligne, sinon null.
    public long? PromotionId { get; set; }
}
