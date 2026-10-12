import { ApiError, InterventionApiRepository } from '@atelio/core/data'
import {
  AddInterventionArticle,
  articleTotal,
  DeleteInterventionArticle,
  ImportQuote,
  UpdateInterventionArticle,
  ValidationError,
  type Article,
  type GarageQuoteSummary,
  type Intervention,
  type InterventionArticle,
} from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import ArticleSearch from '../articles/ArticleSearch'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const qty = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const day = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const input = 'w-full rounded-brand border border-zinc-300 px-2 py-1.5 outline-none focus:border-primary'

/** "4,5" ou "4.5" => 4.5 ; vide ou invalide => NaN. */
function toNumber(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(',', '.'))
}

function errorText(err: unknown): string {
  return err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez."
}

/**
 * Articles de l'intervention, importés du catalogue (prix HT non modifiable) : seuls facturés.
 * On choisit l'article dans la liste, on indique la quantité ; ou on importe un devis du client.
 */
export default function ArticlesCard({
  intervention,
  catalog,
  quotes,
  readOnly = false,
}: {
  intervention: Intervention
  /** Articles actifs du catalogue. */
  catalog: Article[]
  /** Devis du client, importables (une fois chacun). */
  quotes: GarageQuoteSummary[]
  /** Intervention facturée : plus de modification. */
  readOnly?: boolean
}) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const repository = new InterventionApiRepository(api)

  const [selected, setSelected] = useState<Article | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [editing, setEditing] = useState<{ id: number; quantity: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)

  // Devis déjà importés, et ceux du véhicule de l'intervention en premier.
  const imported = new Set(intervention.articles.map((a) => a.quoteId).filter((id) => id !== null))
  const sortedQuotes = [...quotes].sort(
    (a, b) => Number(b.vehiclePlate === intervention.vehiclePlate) - Number(a.vehiclePlate === intervention.vehiclePlate),
  )

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
    if (!selected) {
      setError('Choisissez un article dans la liste.')
      return
    }
    run(
      () => new AddInterventionArticle(repository).execute(intervention.id, selected.id, toNumber(quantity)),
      () => {
        setSelected(null)
        setQuantity('1')
      },
    )
  }

  function save() {
    if (!editing) return
    run(() => new UpdateInterventionArticle(repository).execute(intervention.id, editing.id, toNumber(editing.quantity)), () => setEditing(null))
  }

  function importQuote(quote: GarageQuoteSummary) {
    run(() => new ImportQuote(repository).execute(intervention.id, quote.id), () => setImporting(false))
  }

  function remove(line: InterventionArticle) {
    run(() => new DeleteInterventionArticle(repository).execute(intervention.id, line.id))
  }

  return (
    <section className="rounded-brand bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Articles</h2>
        {!readOnly && quotes.length > 0 && (
          <button type="button" onClick={() => setImporting(!importing)} className="text-sm font-semibold text-primary hover:underline">
            {importing ? 'Fermer' : 'Importer un devis'}
          </button>
        )}
      </div>

      {!readOnly && importing && (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-brand border border-zinc-200 text-sm">
          {sortedQuotes.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
              <div>
                <span className="font-mono font-semibold">{q.number}</span>
                <span className="ml-2 text-zinc-500">
                  {day.format(new Date(q.createdAt))} · <span className="font-mono">{q.vehiclePlate}</span> · {euro.format(q.totalHt)} HT
                </span>
                {q.vehiclePlate !== intervention.vehiclePlate && <span className="ml-2 text-xs text-amber-700">autre véhicule</span>}
              </div>
              {imported.has(q.id) ? (
                <span className="text-xs font-semibold text-emerald-700">✓ Importé</span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => importQuote(q)}
                  className="rounded-brand bg-secondary px-3 py-1 text-xs font-semibold text-on-secondary disabled:opacity-40"
                >
                  Importer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <form onSubmit={add} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-64 flex-1 text-sm">
            <span className="mb-1 block text-xs font-semibold text-zinc-500">Article</span>
            <ArticleSearch catalog={catalog} selected={selected} onSelect={setSelected} />
          </label>
          <label className="w-24 text-sm">
            <span className="mb-1 block text-xs font-semibold text-zinc-500">Quantité</span>
            <input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${input} text-right`} />
          </label>
          <button
            type="submit"
            disabled={busy || !selected}
            className="rounded-brand bg-secondary px-4 py-1.5 text-sm font-semibold text-on-secondary disabled:opacity-40"
          >
            Ajouter
          </button>
        </form>
      )}

      {intervention.articles.length > 0 ? (
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="py-2 pr-2">Article</th>
              <th className="w-24 py-2 pr-2 text-right">Qté</th>
              <th className="w-28 py-2 pr-2 text-right">PU HT</th>
              <th className="w-28 py-2 pr-2 text-right">Total HT</th>
              {!readOnly && <th className="w-36 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {intervention.articles.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="py-2 pr-2">
                  <span className="font-semibold">{a.name}</span>
                  {a.quoteNumber && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-zinc-600">devis {a.quoteNumber}</span>}
                  {a.description && <p className="mt-0.5 whitespace-pre-line text-xs text-zinc-500">{a.description}</p>}
                </td>
                <td className="py-2 pr-2 text-right">
                  {editing?.id === a.id ? (
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={editing.quantity}
                      onChange={(e) => setEditing({ id: a.id, quantity: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') save()
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      aria-label="Quantité"
                      className={`${input} text-right`}
                    />
                  ) : (
                    qty.format(a.quantity)
                  )}
                </td>
                <td className="py-2 pr-2 text-right">{euro.format(a.unitPriceHt)}</td>
                <td className="py-2 pr-2 text-right font-medium">{euro.format(articleTotal(a))}</td>
                {!readOnly && (
                  <td className="py-2 text-right">
                    {editing?.id === a.id ? (
                      <>
                        <button type="button" disabled={busy} onClick={save} className="font-semibold text-primary hover:underline disabled:opacity-40">
                          Enregistrer
                        </button>{' '}
                        <button type="button" onClick={() => setEditing(null)} className="text-zinc-500 hover:underline">
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing({ id: a.id, quantity: String(a.quantity).replace('.', ',') })}
                          className="text-zinc-600 hover:underline"
                        >
                          Quantité
                        </button>{' '}
                        <button type="button" disabled={busy} onClick={() => remove(a)} className="text-red-700 hover:underline disabled:opacity-40">
                          Retirer
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">
          {readOnly ? 'Aucun article.' : catalog.length === 0 ? 'Le catalogue est vide : ajoutez des articles depuis la page Articles.' : 'Aucun article pour l\'instant.'}
        </p>
      )}

      {error && <p className="mt-3 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  )
}
