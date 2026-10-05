using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IInterventionRepository : IRepository<Intervention>
{
    /// <summary>Ligne de prestation de l'intervention (suivie pour modification).</summary>
    Task<InterventionService?> GetServiceLineAsync(long interventionId, long serviceId, CancellationToken cancellationToken = default);

    /// <summary>Intervention avec ses prestations et ses pièces.</summary>
    Task<Intervention?> GetWithLinesAsync(long interventionId, CancellationToken cancellationToken = default);
}

public interface ISparePartRepository : IRepository<SparePart>
{
}
