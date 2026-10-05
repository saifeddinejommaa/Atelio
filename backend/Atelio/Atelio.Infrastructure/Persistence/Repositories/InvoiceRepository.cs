using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    // Clé du verrou PostgreSQL de la numérotation des factures.
    private const long NumberingLockKey = 7_200_000_001;

    public InvoiceRepository(AtelioDbContext context)
        : base(context)
    {
    }

    public Task<Invoice?> GetByInterventionAsync(long interventionId, CancellationToken cancellationToken = default) =>
        DbSet.FirstOrDefaultAsync(i => i.InterventionId == interventionId, cancellationToken);

    public async Task<string> NextNumberAsync(int year, CancellationToken cancellationToken = default)
    {
        // Une seule émission à la fois : deux factures ne peuvent pas prendre le même numéro.
        await Context.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock({NumberingLockKey})", cancellationToken);

        var prefix = $"F-{year}-";
        var last = await DbSet
            .Where(i => i.Number.StartsWith(prefix))
            .OrderByDescending(i => i.Number)
            .Select(i => i.Number)
            .FirstOrDefaultAsync(cancellationToken);

        var next = last is null ? 1 : int.Parse(last[prefix.Length..]) + 1;
        return $"{prefix}{next:D6}";
    }
}

public class PaymentRepository : Repository<Payment>, IPaymentRepository
{
    public PaymentRepository(AtelioDbContext context)
        : base(context)
    {
    }
}
