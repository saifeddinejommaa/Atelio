using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class ArticleRepository : Repository<Article>, IArticleRepository
{
    public ArticleRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<List<Article>> GetAllAsync(string? search, bool? active, CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a => EF.Functions.ILike(a.Name, $"%{search.Trim()}%"));
        }

        if (active is bool isActive)
        {
            query = query.Where(a => a.IsActive == isActive);
        }

        return query.OrderBy(a => a.Name).ToListAsync(cancellationToken);
    }

    public Task<bool> NameExistsAsync(string name, long? exceptId, CancellationToken cancellationToken = default) =>
        DbSet.AnyAsync(a => a.Name.ToLower() == name.ToLower() && a.Id != exceptId, cancellationToken);
}

public class InterventionArticleRepository : Repository<InterventionArticle>, IInterventionArticleRepository
{
    public InterventionArticleRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<bool> HasQuoteAsync(long interventionId, long quoteId, CancellationToken cancellationToken = default) =>
        DbSet.AnyAsync(a => a.InterventionId == interventionId && a.QuoteId == quoteId, cancellationToken);
}
