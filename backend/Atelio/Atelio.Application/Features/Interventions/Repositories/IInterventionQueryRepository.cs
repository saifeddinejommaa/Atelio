using Atelio.Application.Features.Interventions.Requests;
using Atelio.Application.Features.Interventions.Responses;

namespace Atelio.Application.Features.Interventions.Repositories;

public interface IInterventionQueryRepository
{
    Task<InterventionResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>Interventions filtrées, de la plus récente à la plus ancienne.</summary>
    Task<IReadOnlyList<InterventionSummaryResponse>> GetInterventionsAsync(
        InterventionsRequestFilter filter, CancellationToken cancellationToken = default);
}
