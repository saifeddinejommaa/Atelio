import { ApiError, InterventionApiRepository } from '@atelio/core/data'
import {
  AddSparePart,
  DeleteSparePart,
  UpdateSparePart,
  ValidationError,
  type Intervention,
  type SparePart,
  type SparePartInput,
} from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const qty = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

type Draft = { reference: string; name: string; quantity: string; unitPrice: string }

const EMPTY: Draft = { reference: '', name: '', quantity: '1', unitPrice: '' }

/** "4,5" ou "4.5" => 4.5 ; vide ou invalide => NaN. */
function toNumber(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(',', '.'))
}

function toInput(draft: Draft): SparePartInput {
  return {
    reference: draft.reference,
    name: draft.name,
    quantity: toNumber(draft.quantity),
    unitPrice: toNumber(draft.unitPrice),
  }
}

function toDraft(part: SparePart): Draft {
  return {
    reference: part.reference ?? '',
    name: part.name,
    quantity: String(part.quantity).replace('.', ','),
    unitPrice: String(part.unitPrice).replace('.', ','),
  }
}

function errorText(err: unknown): string {
  return err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez."
}

/**
 * Pièces et fournitures de l'intervention (saisies par l'accueil, prix TTC).
 * Le kit des prestations sert d'aide-mémoire : un clic pré-remplit la désignation à compléter.
 */
export default function SparePartsCard({
  intervention,
  readOnly = false,
}: {
  intervention: Intervention
  /** Intervention facturée : plus de modification. */
  readOnly?: boolean
}) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const repository = new InterventionApiRepository(api)

  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editing, setEditing] = useState<{ id: number; draft: Draft } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Pièces du kit pas encore ajoutées (même désignation, sans tenir compte des majuscules).
  const used = new Set(intervention.spareParts.map((p) => p.name.trim().toLowerCase()))
  const suggestions = intervention.kit.filter((k) => !used.has(k.name.trim().toLowerCase()))
  const services = [...new Set(suggestions.map((k) => k.serviceName))]

  async function run(action: () => Promise<unknown>, onDone?: () => void) {
    setBusy(true)
    setError('')
    try {
      await action()
      onDone?.()
      await revalidator.revalidate()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  function add(e: FormEvent) {
    e.preventDefault()
    run(() => new AddSparePart(repository).execute(intervention.id, toInput(draft)), () => setDraft(EMPTY))
  }

  function save() {
    if (!editing) return
    run(() => new UpdateSparePart(repository).execute(intervention.id, editing.id, toInput(editing.draft)), () => setEditing(null))
  }

  function remove(id: number) {
    run(() => new DeleteSparePart(repository).execute(intervention.id, id))
  }

  return (
    <section className="rounded-brand bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Pièces et fournitures</h2>

      {!readOnly && services.length > 0 && (
        <div className="mt-3 space-y-2">
          {services.map((service) => (
            <div key={service} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-500">À prévoir pour « {service} » :</span>
              {suggestions
                .filter((k) => k.serviceName === service)
                .map((k) => (
                  <button
                    key={k.name}
                    type="button"
                    onClick={() => setDraft({ ...EMPTY, name: k.name, quantity: '' })}
                    className="rounded-full border border-dashed border-secondary px-3 py-1 font-medium text-foreground hover:bg-muted"
                  >
                    + {k.name}
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add}>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="py-2 pr-2">Référence</th>
              <th className="py-2 pr-2">Désignation</th>
              <th className="w-20 py-2 pr-2 text-right">Qté</th>
              <th className="w-28 py-2 pr-2 text-right">PU TTC</th>
              <th className="w-28 py-2 pr-2 text-right">Total TTC</th>
              {!readOnly && <th className="w-32 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {intervention.spareParts.map((p) =>
              editing?.id === p.id ? (
                <tr key={p.id}>
                  <DraftCells draft={editing.draft} onChange={(d) => setEditing({ id: p.id, draft: d })} />
                  <td className="py-2 text-right">
                    <button type="button" disabled={busy} onClick={save} className="font-semibold text-primary hover:underline disabled:opacity-40">
                      Enregistrer
                    </button>{' '}
                    <button type="button" onClick={() => setEditing(null)} className="text-zinc-500 hover:underline">
                      Annuler
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td className="py-2 pr-2 font-mono text-xs">{p.reference ?? '—'}</td>
                  <td className="py-2 pr-2">{p.name}</td>
                  <td className="py-2 pr-2 text-right">{qty.format(p.quantity)}</td>
                  <td className="py-2 pr-2 text-right">{euro.format(p.unitPrice)}</td>
                  <td className="py-2 pr-2 text-right font-medium">{euro.format(p.quantity * p.unitPrice)}</td>
                  {!readOnly && (
                    <td className="py-2 text-right">
                    <button type="button" onClick={() => setEditing({ id: p.id, draft: toDraft(p) })} className="text-zinc-600 hover:underline">
                      Modifier
                    </button>{' '}
                    <button type="button" disabled={busy} onClick={() => remove(p.id)} className="text-red-700 hover:underline disabled:opacity-40">
                      Supprimer
                    </button>
                    </td>
                  )}
                </tr>
              ),
            )}
            {!readOnly && (
              <tr>
                <DraftCells draft={draft} onChange={setDraft} />
              <td className="py-2 text-right">
                <button type="submit" disabled={busy} className="rounded-brand bg-secondary px-3 py-1.5 font-semibold text-on-secondary disabled:opacity-40">
                  Ajouter
                </button>
              </td>
              </tr>
            )}
          </tbody>
        </table>
      </form>

      {intervention.spareParts.length === 0 && !readOnly && (
        <p className="mt-2 text-xs text-zinc-500">Aucune pièce pour l'instant. Utilisez les suggestions ci-dessus ou saisissez une pièce.</p>
      )}
      {error && <p className="mt-3 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  )
}

function DraftCells({ draft, onChange }: { draft: Draft; onChange: (draft: Draft) => void }) {
  const input = 'w-full rounded-brand border border-zinc-300 px-2 py-1.5 outline-none focus:border-primary'
  const total = toNumber(draft.quantity) * toNumber(draft.unitPrice)
  return (
    <>
      <td className="py-2 pr-2">
        <input value={draft.reference} onChange={(e) => onChange({ ...draft, reference: e.target.value })} placeholder="Réf." aria-label="Référence" className={input} />
      </td>
      <td className="py-2 pr-2">
        <input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} placeholder="Désignation" aria-label="Désignation" className={input} />
      </td>
      <td className="py-2 pr-2">
        <input
          inputMode="decimal"
          value={draft.quantity}
          onChange={(e) => onChange({ ...draft, quantity: e.target.value })}
          aria-label="Quantité"
          className={`${input} text-right`}
        />
      </td>
      <td className="py-2 pr-2">
        <input
          inputMode="decimal"
          value={draft.unitPrice}
          onChange={(e) => onChange({ ...draft, unitPrice: e.target.value })}
          placeholder="0,00"
          aria-label="Prix unitaire TTC"
          className={`${input} text-right`}
        />
      </td>
      <td className="py-2 pr-2 text-right text-zinc-500">{Number.isFinite(total) ? euro.format(total) : '—'}</td>
    </>
  )
}
