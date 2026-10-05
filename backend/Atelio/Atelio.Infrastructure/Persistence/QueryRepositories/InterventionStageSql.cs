namespace Atelio.Infrastructure.Persistence.QueryRepositories;

/// <summary>
/// Étape d'une intervention, déduite de son statut et de sa facture :
/// in_progress (en cours), ready (prête), invoiced (facturée), closed (payée, clôturée), cancelled.
/// Alias attendus : i (intervention), inv (invoice).
/// </summary>
internal static class InterventionStageSql
{
    public const string Expression = """
        CASE
            WHEN inv.status = 'paid' THEN 'closed'
            WHEN inv.id IS NOT NULL THEN 'invoiced'
            WHEN i.status = 'done' THEN 'ready'
            WHEN i.status = 'cancelled' THEN 'cancelled'
            ELSE 'in_progress'
        END
        """;
}
