using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface ICustomerRepository : IRepository<Customer>
{
    Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<bool> ExistsByEmailAsync(string email, long? excludeId = null, CancellationToken cancellationToken = default);
}
