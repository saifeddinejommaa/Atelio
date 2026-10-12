using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IQuoteRepository : IRepository<Quote>
{
    /// <summary>Prochain numéro de devis de l'année (D-2026-000001), sous verrou jusqu'à la fin de la transaction.</summary>
    Task<string> NextNumberAsync(int year, CancellationToken cancellationToken = default);

    /// <summary>Devis avec ses lignes.</summary>
    Task<Quote?> GetWithLinesAsync(long id, CancellationToken cancellationToken = default);
}
