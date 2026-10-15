using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class PromotionRepository : Repository<Promotion>, IPromotionRepository
{
    public PromotionRepository(AtelioDbContext context)
        : base(context)
    {
    }
}
