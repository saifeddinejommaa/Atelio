using Atelio.Domain;
using Atelio.Domain.Repositories;

namespace Atelio.Application.Common;

internal static class BookingRules
{
    /// <summary>
    /// Durée totale des services demandés. Vérifie qu'ils existent, sont actifs
    /// et réalisés par le garage.
    /// </summary>
    public static async Task<int> GetDurationAsync(
        IGarageRepository garages,
        IServiceRepository services,
        long garageId,
        IReadOnlyCollection<long> serviceIds,
        CancellationToken cancellationToken)
    {
        var ids = serviceIds.Distinct().ToList();
        var found = await services.GetActiveByIdsAsync(ids, cancellationToken);
        if (found.Count != ids.Count)
        {
            throw new BusinessException("Un ou plusieurs services demandés n'existent pas.");
        }

        var offered = await garages.GetServiceIdsAsync(garageId, cancellationToken);
        var missing = found.Where(s => !offered.Contains(s.Id)).Select(s => s.Name).ToList();
        if (missing.Count > 0)
        {
            throw new BusinessException($"Ce garage ne réalise pas : {string.Join(", ", missing)}.");
        }

        return found.Sum(s => s.DurationMinutes);
    }
}
