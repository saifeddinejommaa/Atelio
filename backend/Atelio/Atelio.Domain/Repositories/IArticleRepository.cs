using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IArticleRepository : IRepository<Article>
{
    /// <summary>Articles du catalogue par nom ; search : partie du nom ; active : filtre sur l'état (null = tous).</summary>
    Task<List<Article>> GetAllAsync(string? search, bool? active, CancellationToken cancellationToken = default);

    /// <summary>Un autre article porte-t-il déjà ce nom (sans tenir compte des majuscules) ?</summary>
    Task<bool> NameExistsAsync(string name, long? exceptId, CancellationToken cancellationToken = default);
}

public interface IInterventionArticleRepository : IRepository<InterventionArticle>
{
    /// <summary>Ce devis a-t-il déjà été importé sur l'intervention ?</summary>
    Task<bool> HasQuoteAsync(long interventionId, long quoteId, CancellationToken cancellationToken = default);
}
