using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class QuoteRepository : Repository<Quote>, IQuoteRepository
{
    // Clé du verrou PostgreSQL de la numérotation des devis.
    private const long NumberingLockKey = 7_200_000_002;

    public QuoteRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<Quote?> GetWithLinesAsync(long id, CancellationToken cancellationToken = default) =>
        DbSet.AsNoTracking().Include(q => q.Lines).FirstOrDefaultAsync(q => q.Id == id, cancellationToken);

    public async Task<string> NextNumberAsync(int year, CancellationToken cancellationToken = default)
    {
        // Un seul devis numéroté à la fois : deux devis ne peuvent pas prendre le même numéro.
        await Context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({NumberingLockKey})", cancellationToken);

        var prefix = $"D-{year}-";
        var last = await DbSet
            .Where(q => q.Number.StartsWith(prefix))
            .OrderByDescending(q => q.Number)
            .Select(q => q.Number)
            .FirstOrDefaultAsync(cancellationToken);

        var next = last is null ? 1 : int.Parse(last[prefix.Length..]) + 1;
        return $"{prefix}{next:D6}";
    }
}
