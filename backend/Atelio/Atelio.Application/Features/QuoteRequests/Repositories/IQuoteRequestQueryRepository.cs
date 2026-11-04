using Atelio.Application.Features.QuoteRequests.Responses;

namespace Atelio.Application.Features.QuoteRequests.Repositories;

public interface IQuoteRequestQueryRepository
{
    /// <summary>Demandes à traiter d'abord, puis les plus récentes.</summary>
    Task<IReadOnlyList<QuoteRequestResponse>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<QuoteRequestResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>Nombre de demandes à traiter (pastille du menu).</summary>
    Task<int> CountPendingAsync(CancellationToken cancellationToken = default);
}
