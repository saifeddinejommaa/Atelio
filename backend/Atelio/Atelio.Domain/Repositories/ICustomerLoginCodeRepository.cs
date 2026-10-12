using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface ICustomerLoginCodeRepository : IRepository<CustomerLoginCode>
{
    /// <summary>Codes demandés pour cet e-mail depuis cette date (limite d'envoi).</summary>
    Task<int> CountSinceAsync(string email, DateTime sinceUtc, CancellationToken cancellationToken = default);

    /// <summary>Dernier code non utilisé de cet e-mail (suivi pour modification), ou null.</summary>
    Task<CustomerLoginCode?> GetLatestUnusedAsync(string email, CancellationToken cancellationToken = default);
}
