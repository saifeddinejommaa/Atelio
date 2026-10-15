using Atelio.Domain.Entities;
using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

public interface IServiceRepository : IRepository<Service>
{
    Task<IReadOnlyList<Service>> GetActiveByIdsAsync(IReadOnlyCollection<long> ids, CancellationToken cancellationToken = default);

    /// <summary>Prestations, actives ou non (ex. libellés d'une facture).</summary>
    Task<IReadOnlyList<Service>> GetByIdsAsync(IReadOnlyCollection<long> ids, CancellationToken cancellationToken = default);

    /// <summary>Une autre prestation porte déjà ce nom (sans tenir compte des majuscules).</summary>
    Task<bool> NameExistsAsync(string name, long? exceptId, CancellationToken cancellationToken = default);

    Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>Prestation déjà utilisée (rendez-vous, interventions ou promotions) : elle ne peut plus être supprimée.</summary>
    Task<bool> IsUsedAsync(long serviceId, CancellationToken cancellationToken = default);

    /// <summary>Propose la prestation dans tous les garages de la marque (à enregistrer avec l'unité de travail).</summary>
    Task AddToAllGaragesAsync(long serviceId, CancellationToken cancellationToken = default);
}
