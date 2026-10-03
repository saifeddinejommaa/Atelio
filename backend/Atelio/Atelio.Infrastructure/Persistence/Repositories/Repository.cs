using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Planning;
using Atelio.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class Repository<TEntity> : IRepository<TEntity>
    where TEntity : class
{
    protected readonly AtelioDbContext Context;
    protected readonly DbSet<TEntity> DbSet;

    public Repository(AtelioDbContext context)
    {
        Context = context;
        DbSet = context.Set<TEntity>();
    }

    public async Task<TEntity?> GetByIdAsync(long id, CancellationToken cancellationToken = default) =>
        await DbSet.FindAsync([id], cancellationToken);

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default) =>
        await DbSet.AddAsync(entity, cancellationToken);

    public void Update(TEntity entity) => DbSet.Update(entity);

    public void Remove(TEntity entity) => DbSet.Remove(entity);
}
