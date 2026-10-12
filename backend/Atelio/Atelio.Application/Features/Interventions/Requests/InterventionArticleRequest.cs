namespace Atelio.Application.Features.Interventions.Requests;

public class InterventionArticleRequest
{
    // Article du catalogue (ignoré en modification : seule la quantité change).
    public long ArticleId { get; set; }

    public decimal Quantity { get; set; }
}
