using Atelio.Application.Common;
using Atelio.Application.Features.Customers.Requests;
using Atelio.Application.Features.Customers.Responses;

namespace Atelio.Application.Features.Customers.Repositories;

public interface ICustomerQueryRepository
{
    /// <summary>Clients par nom, avec leurs immatriculations, dernière visite et nombre de factures.</summary>
    Task<PagedResponse<CustomerSummaryResponse>> GetCustomersAsync(CustomersRequestFilter filter, CancellationToken cancellationToken = default);

    /// <summary>Factures du client, des plus récentes aux plus anciennes.</summary>
    Task<IReadOnlyList<CustomerInvoiceResponse>> GetInvoicesAsync(long customerId, CancellationToken cancellationToken = default);
}
