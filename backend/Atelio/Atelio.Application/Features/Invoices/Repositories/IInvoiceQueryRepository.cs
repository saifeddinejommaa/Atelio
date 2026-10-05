using Atelio.Application.Features.Invoices.Responses;

namespace Atelio.Application.Features.Invoices.Repositories;

public interface IInvoiceQueryRepository
{
    Task<InvoiceResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
}
