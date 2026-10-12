using Atelio.Application.Features.Quotes.Responses;

namespace Atelio.Application.Features.Quotes.Repositories;

public interface IQuoteQueryRepository
{
    Task<QuoteResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>Devis du client, des plus récents aux plus anciens.</summary>
    Task<IReadOnlyList<QuoteSummaryResponse>> GetByCustomerAsync(long customerId, CancellationToken cancellationToken = default);
}
