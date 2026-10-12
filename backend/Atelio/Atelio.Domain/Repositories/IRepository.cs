using Atelio.Domain.Entities;
using Atelio.Domain.Planning;

namespace Atelio.Domain.Repositories;

// Repositories d'écriture (EF Core). Les lectures pour l'API passent par les
// query repositories de la couche Application (Dapper).

public interface IRepository<TEntity>
    where TEntity : class
{
    Task<TEntity?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);

    void Update(TEntity entity);

    void Remove(TEntity entity);
}
