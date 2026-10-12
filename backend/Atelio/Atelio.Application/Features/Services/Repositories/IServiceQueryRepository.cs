using Atelio.Application.Features.Services.Requests;
using Atelio.Application.Features.Services.Responses;

namespace Atelio.Application.Features.Services.Repositories;

public interface IServiceQueryRepository
{
    /// <summary>Services actifs.</summary>
    Task<IReadOnlyList<ServiceResponse>> GetServicesAsync(
        ServicesRequestFilter filter,
        CancellationToken cancellationToken = default);

    Task<ServiceResponse?> GetByCodeAsync(
        string code,
        CancellationToken cancellationToken = default);
}
