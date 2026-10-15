using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface ICustomerRepository : IRepository<Customer>
{
    Task<Customer?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<bool> ExistsByEmailAsync(string email, long? excludeId = null, CancellationToken cancellationToken = default);

    /// <summary>Clients actifs dont le téléphone se termine par ces chiffres (voir TextRules.PhoneKey).</summary>
    Task<IReadOnlyList<Customer>> GetActiveByPhoneKeyAsync(string phoneKey, CancellationToken cancellationToken = default);
}
