using Atelio.Domain.Entities;

namespace Atelio.Domain.Repositories;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetByInterventionAsync(long interventionId, CancellationToken cancellationToken = default);

    /// <summary>Facture avec ses lignes.</summary>
    Task<Invoice?> GetWithLinesAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Prochain numéro de facture de l'année, continu et sans trou (ex. "F-2026-000124").
    /// Verrouille la numérotation jusqu'à la fin de la transaction en cours.
    /// </summary>
    Task<string> NextNumberAsync(int year, CancellationToken cancellationToken = default);
}

public interface IPaymentRepository : IRepository<Payment>
{
    /// <summary>Paiements réussis de la facture, du plus ancien au plus récent.</summary>
    Task<List<Payment>> GetSucceededAsync(long invoiceId, CancellationToken cancellationToken = default);
}

public interface IInvoiceDocumentRepository : IRepository<InvoiceDocument>
{
    /// <summary>Versions PDF de la facture, de la plus récente à la plus ancienne.</summary>
    Task<List<InvoiceDocument>> GetByInvoiceAsync(long invoiceId, CancellationToken cancellationToken = default);
}
