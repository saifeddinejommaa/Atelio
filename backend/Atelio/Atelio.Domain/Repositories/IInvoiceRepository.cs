using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetByInterventionAsync(long interventionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Prochain numéro de facture de l'année, continu et sans trou (ex. "F-2026-000124").
    /// Verrouille la numérotation jusqu'à la fin de la transaction en cours.
    /// </summary>
    Task<string> NextNumberAsync(int year, CancellationToken cancellationToken = default);
}

public interface IPaymentRepository : IRepository<Payment>
{
}
