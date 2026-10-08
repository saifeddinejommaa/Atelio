import { ApiError, InvoiceApiRepository } from '@atelio/core/data'
import { FinishIntervention, InterventionStatus, IssueInvoice, PayInvoice, type Intervention, type PaymentMethod } from '@atelio/core/domain'
import { useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import { paymentMethods } from './InterventionStatus'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const dateTime = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/**
 * Étape suivante de l'intervention :
 * en cours → [Terminer les travaux] → prête → [Facturer] → facturée → [Encaisser] → clôturée.
 */
export default function InterventionActions({ intervention }: { intervention: Intervention }) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const repository = new InvoiceApiRepository(api)
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await action()
      setConfirming(false)
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : "L'action a échoué, réessayez.")
    } finally {
      setBusy(false)
    }
  }

  const primary = 'rounded-brand bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary disabled:opacity-40'
  const secondary = 'rounded-brand border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold hover:border-primary'
  const invoiceLink = intervention.invoiceId !== null && (
    <Link to={`/factures/${intervention.invoiceId}`} className={secondary}>
      Voir / imprimer la facture {intervention.invoiceNumber}
    </Link>
  )

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {intervention.status.id === InterventionStatus.InProgress &&
        (confirming ? (
          <>
            <span className="text-sm text-zinc-600">Les travaux sont terminés ?</span>
            <button type="button" disabled={busy} onClick={() => run(() => new FinishIntervention(repository).execute(intervention.id))} className={primary}>
              Oui, véhicule prêt
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={secondary}>
              Annuler
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={primary}>
            Terminer les travaux
          </button>
        ))}

      {intervention.status.id === InterventionStatus.Done &&
        (confirming ? (
          <>
            <span className="text-sm text-zinc-600">Après la facture, l'intervention ne pourra plus être modifiée.</span>
            <button type="button" disabled={busy} onClick={() => run(() => new IssueInvoice(repository).execute(intervention.id))} className={primary}>
              Émettre la facture
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={secondary}>
              Annuler
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={primary}>
            Facturer
          </button>
        ))}

      {intervention.status.id === InterventionStatus.Invoiced && (
        <>
          {invoiceLink}
          <select
            aria-label="Moyen de paiement"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="rounded-brand border border-zinc-300 bg-white px-3 py-2.5 text-sm"
          >
            {Object.entries(paymentMethods).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => new PayInvoice(repository).execute(intervention.invoiceId!, method))}
            className={primary}
          >
            Encaisser {intervention.invoiceTotalTtc !== null && euro.format(intervention.invoiceTotalTtc)}
          </button>
        </>
      )}

      {intervention.status.id === InterventionStatus.Closed && (
        <>
          {intervention.paidAt && (
            <span className="text-sm text-zinc-600">
              Réglée le {dateTime.format(new Date(intervention.paidAt))}
              {intervention.paymentMethod && ` · ${paymentMethods[intervention.paymentMethod]}`}
            </span>
          )}
          {invoiceLink}
        </>
      )}

      {error && <p className="w-full rounded-brand bg-red-50 px-3 py-2 text-right text-sm text-red-700">{error}</p>}
    </div>
  )
}
