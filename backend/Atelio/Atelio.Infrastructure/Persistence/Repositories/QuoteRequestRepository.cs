using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;

namespace Atelio.Infrastructure.Persistence.Repositories;

public class QuoteRequestRepository : Repository<QuoteRequest>, IQuoteRequestRepository
{
    public QuoteRequestRepository(AtelioDbContext context)
        : base(context)
    {
    }
}
