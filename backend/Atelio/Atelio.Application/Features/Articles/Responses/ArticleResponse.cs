using Atelio.Domain.Entities;

namespace Atelio.Application.Features.Articles.Responses;

public class ArticleResponse
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    // € HT.
    public decimal UnitPriceHt { get; set; }

    public bool IsActive { get; set; }

    public static ArticleResponse From(Article article) => new()
    {
        Id = article.Id,
        Name = article.Name,
        Description = article.Description,
        UnitPriceHt = article.UnitPriceHt,
        IsActive = article.IsActive,
    };
}
