using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IStatusRepository
{
    /// <summary>Tous les statuts d'une table de statuts (actifs et inactifs), par id.</summary>
    Task<IReadOnlyList<TStatus>> GetAllAsync<TStatus>(CancellationToken cancellationToken = default)
        where TStatus : StatusLookup;
}
