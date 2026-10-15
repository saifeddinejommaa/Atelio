import { ApiError, InvoiceApiRepository } from '@atelio/core/data'
import {
  FinishIntervention,
  interventionTotals,
  InterventionStatus,
  IssueInvoice,
  PayInvoice,
  ValidationError,
  type Intervention,
  type PaymentMethod,
} from '@atelio/core/domain'
import { useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import { paymentMethods } from './InterventionStatus'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const dateTime = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/** "120,50" ou "120.5" => 120.5 ; vide ou invalide => NaN. */
function toNumber(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(/\s/g, '').replace(',', '.'))
}

/** 251.88 => "251,88" (valeur de départ d'un champ montant). */
function toInput(amount: number): string {
  return amount.toFixed(2).replace('.', ',')
}

/**
 * Étape suivante de l'intervention :
 * en cours → [Terminer les travaux] → prête → [Facturer + 1er règlement] → facturée → [Encaisser…] → clôturée.
 * Le PDF de la facture est généré à la facturation, puis une nouvelle version à chaque règlement.
 */
export default function InterventionActions({ intervention }: { intervention: Intervention }) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const repository = new InvoiceApiRepository(api)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const totalTtc = intervention.invoiceTotalTtc ?? interventionTotals(intervention).ttc
  const remaining = Math.max(0, Math.round((totalTtc - intervention.invoiceAmountPaid) * 100) / 100)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await action()
      setConfirming(false)
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'action a échoué, réessayez.")
    } finally {
      setBusy(false)
    }
  }

  const primary = 'rounded-brand bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary disabled:opacity-40'
  const secondary = 'rounded-brand border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold hover:border-primary'
  const invoiceLink = intervention.invoiceId !== null && (
    <Link to={`/factures/${intervention.invoiceId}`} className={secondary}>
      Voir la facture {intervention.invoiceNumber}
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
          // Grisé tant qu'aucun article n'est ajouté : il n'y aurait rien à facturer.
          <button
            type="button"
            disabled={intervention.articles.length === 0}
            title={intervention.articles.length === 0 ? 'Ajoutez au moins un article avant de terminer les travaux.' : undefined}
            onClick={() => setConfirming(true)}
            className={primary}
          >
            Terminer les travaux
          </button>
        ))}

      {intervention.status.id === InterventionStatus.Done &&
        (confirming ? (
          <PaymentForm
            title={`Facturer ${euro.format(totalTtc)} TTC`}
            hint="Après la facture, l'intervention ne pourra plus être modifiée. Montant 0 : tout reste à payer."
            max={totalTtc}
            allowZero
            submitLabel="Émettre la facture"
            busy={busy}
            onCancel={() => setConfirming(false)}
            onSubmit={(amount, method) => run(() => new IssueInvoice(repository).execute(intervention.id, amount, method, totalTtc))}
          />
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={primary}>
            Facturer
          </button>
        ))}

      {intervention.status.id === InterventionStatus.Invoiced && (
        <>
          {invoiceLink}
          {confirming ? (
            <PaymentForm
              title={`Reste à payer ${euro.format(remaining)}`}
              hint={`Déjà réglé : ${euro.format(intervention.invoiceAmountPaid)} sur ${euro.format(totalTtc)}.`}
              max={remaining}
              submitLabel="Encaisser"
              busy={busy}
              onCancel={() => setConfirming(false)}
              onSubmit={(amount, method) => run(() => new PayInvoice(repository).execute(intervention.invoiceId!, method!, amount, remaining))}
            />
          ) : (
            <>
              <span className="text-sm text-zinc-600">
                Reste à payer <strong>{euro.format(remaining)}</strong>
              </span>
              <button type="button" onClick={() => setConfirming(true)} className={primary}>
                Encaisser un règlement
              </button>
            </>
          )}
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

/** Montant reçu (pré-rempli au maximum, modifiable pour un règlement partiel) et moyen de paiement. */
function PaymentForm({
  title,
  hint,
  max,
  allowZero = false,
  submitLabel,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string
  hint: string
  max: number
  /** Facturation : 0 possible (rien n'est réglé tout de suite). */
  allowZero?: boolean
  submitLabel: string
  busy: boolean
  onCancel: () => void
  onSubmit: (amount: number, method: PaymentMethod | null) => void
}) {
  const [amount, setAmount] = useState(toInput(max))
  const [method, setMethod] = useState<PaymentMethod>('card')
  const value = toNumber(amount)
  const nothingPaid = value === 0
  const input = 'rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary'

  return (
    <div className="w-full max-w-xl rounded-brand border border-zinc-200 bg-white p-4 text-left shadow-sm">
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm text-zinc-600">{hint}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">Montant reçu (€ TTC)</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${input} w-36 text-right`} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">Moyen de paiement</span>
          <select
            value={method}
            disabled={nothingPaid}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className={`${input} disabled:opacity-40`}
          >
            {Object.entries(paymentMethods).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-1 pb-0.5 text-sm">
          <button type="button" onClick={() => setAmount(toInput(max))} className="rounded-brand px-2 py-1.5 font-semibold text-primary hover:bg-muted">
            Tout
          </button>
          {allowZero && (
            <button type="button" onClick={() => setAmount('0')} className="rounded-brand px-2 py-1.5 font-semibold text-primary hover:bg-muted">
              Rien pour l'instant
            </button>
          )}
        </div>
      </div>
      {Number.isFinite(value) && value > 0 && value < max && (
        <p className="mt-2 text-sm text-amber-700">Règlement partiel : il restera {euro.format(Math.round((max - value) * 100) / 100)} à payer.</p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-brand border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:border-primary">
          Annuler
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmit(value, nothingPaid ? null : method)}
          className="rounded-brand bg-secondary px-5 py-2 text-sm font-semibold text-on-secondary disabled:opacity-40"
        >
          {busy ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </div>
  )
}
