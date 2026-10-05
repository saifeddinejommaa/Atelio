using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IServiceCategoryRepository : IRepository<ServiceCategory>
{
    /// <summary>Toutes les catégories, dans l'ordre d'affichage.</summary>
    Task<IReadOnlyList<ServiceCategory>> GetAllAsync(CancellationToken cancellationToken = default);
}
