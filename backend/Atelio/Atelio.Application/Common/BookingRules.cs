using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Planning;
using Atelio.Domain.Repositories;

namespace Atelio.Application.Common;

/// <summary>Travail demandé : durée (somme des prestations, hors pauses) et présence d'une prestation à durée incertaine.</summary>
internal record BookingWork(int Minutes, bool Uncertain);

internal static class BookingRules
{
    /// <summary>Les prestations à durée incertaine (ex. « Autre ») se placent de préférence avant cette heure.</summary>
    public static readonly TimeOnly UncertainLatestStart = new(12, 0);

    /// <summary>
    /// Travail des prestations demandées. Vérifie qu'elles existent, sont actives et réalisées par le garage.
    /// </summary>
    public static async Task<BookingWork> GetWorkAsync(
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

        return new BookingWork(found.Sum(s => s.DurationMinutes), found.Any(s => s.UncertainDuration));
    }

    /// <summary>Travail d'un rendez-vous existant (ses prestations ; à défaut, sa durée prévue).</summary>
    public static async Task<BookingWork> GetAppointmentWorkAsync(
        IServiceRepository services, Appointment appointment, CancellationToken cancellationToken)
    {
        var found = await services.GetActiveByIdsAsync(appointment.Services.Select(s => s.ServiceId).ToList(), cancellationToken);
        var minutes = found.Sum(s => s.DurationMinutes);
        return new BookingWork(
            minutes > 0 ? minutes : (int)(appointment.EstimatedEndAt - appointment.ScheduledAt).TotalMinutes,
            found.Any(s => s.UncertainDuration));
    }

    /// <summary>Avertissement (back-office) : prestation à durée incertaine placée l'après-midi.</summary>
    public static string? UncertainWarning(BookingWork work, DateTime localStart) =>
        work.Uncertain && TimeOnly.FromDateTime(localStart) >= UncertainLatestStart
            ? "Prestation à durée incertaine : à placer de préférence le matin, pour rendre la voiture le jour même."
            : null;

    /// <summary>
    /// Planificateur du garage pour les jours [from, to] (heure locale), avec les mécaniciens et les travaux
    /// prévus. excludeAppointmentId : rendez-vous à ignorer (celui qu'on déplace).
    /// </summary>
    public static async Task<SlotPlanner> CreatePlannerAsync(
        IPlanningRepository planning,
        ITenantContext tenant,
        Garage garage,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken,
        long? excludeAppointmentId = null)
    {
        // Marge d'un jour de chaque côté pour couvrir les décalages horaires.
        var fromUtc = from.AddDays(-1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtc = to.AddDays(2).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        return new SlotPlanner(
            garage,
            tenant.TimeZone,
            await planning.GetMechanicsAsync(garage.Id, fromUtc, toUtc, cancellationToken),
            await planning.GetPlannedJobsAsync(garage.Id, fromUtc, toUtc, cancellationToken, excludeAppointmentId));
    }
}
