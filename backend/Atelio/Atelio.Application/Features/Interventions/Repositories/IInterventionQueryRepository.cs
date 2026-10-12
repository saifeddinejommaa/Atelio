using Atelio.Application.Common;
using Atelio.Application.Common;
using Atelio.Application.Features.Interventions.Requests;
using Atelio.Application.Features.Interventions.Responses;

namespace Atelio.Application.Features.Interventions.Repositories;

public interface IInterventionQueryRepository
{
    Task<InterventionResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>Page d'interventions filtrées, de la plus récente à la plus ancienne, et leur nombre total.</summary>
    Task<PagedResponse<InterventionSummaryResponse>> GetInterventionsAsync(
        InterventionsRequestFilter filter, CancellationToken cancellationToken = default);
}
