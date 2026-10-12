using Atelio.Application.Features.Invoices.Requests;
using Atelio.Application.Features.Invoices.Responses;

namespace Atelio.Application.Features.Invoices.Repositories;

public interface IInvoiceQueryRepository
{
    Task<InvoiceResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>Factures filtrées, des plus récentes aux plus anciennes, par pages, avec les totaux du filtre.</summary>
    Task<InvoicesPageResponse> GetInvoicesAsync(InvoicesRequestFilter filter, CancellationToken cancellationToken = default);
}
