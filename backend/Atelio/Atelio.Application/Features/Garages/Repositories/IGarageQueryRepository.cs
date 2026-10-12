using Atelio.Application.Features.Garages.Requests;
using Atelio.Application.Features.Garages.Responses;

namespace Atelio.Application.Features.Garages.Repositories;

public interface IGarageQueryRepository
{
    /// <summary>Garages actifs.</summary>
    Task<IReadOnlyList<GarageResponse>> GetGaragesAsync(
        GaragesRequestFilter filter,
        CancellationToken cancellationToken = default);

    Task<GarageResponse?> GetByIdAsync(
        long id,
        CancellationToken cancellationToken = default);
}
