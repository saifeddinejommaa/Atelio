import { ApiError, ArticleApiRepository, InterventionApiRepository } from '@atelio/core/data'
import {
  AddInterventionArticle,
  CreateArticle,
  articleTotal,
  DeleteInterventionArticle,
  ImportQuote,
  UpdateInterventionArticle,
  ValidationError,
  type Article,
  type GarageQuoteSummary,
  type Intervention,
  type InterventionArticle,
  type Promotion,
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

const percent = (p: number) => `-${qty.format(p)} %`

/** Option d'une promotion dans les listes : « Promo pneus (-20 %) ». */
const promotionLabel = (p: Pick<Promotion, 'title' | 'discountPercent'>) => `${p.title} (${percent(p.discountPercent)})`

/** Choix de la promotion d'une ligne ; current : promotion déjà sur la ligne, gardée même si elle est terminée. */
function PromotionSelect({
  promotions,
  value,
  onChange,
  current,
}: {
  promotions: Promotion[]
  value: string
  onChange: (value: string) => void
  current?: InterventionArticle
}) {
  const kept = current?.promotionId != null && !promotions.some((p) => p.id === current.promotionId)
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Promotion" className={input}>
      <option value="">Aucune promotion</option>
      {kept && (
        <option value={current.promotionId!}>
          {promotionLabel({ title: current.promotionTitle ?? 'Promotion', discountPercent: current.discountPercent ?? 0 })}
        </option>
      )}
      {promotions.map((p) => (
        <option key={p.id} value={p.id}>
          {promotionLabel(p)}
        </option>
      ))}
    </select>
  )
}

/**
 * Articles de l'intervention, importés du catalogue (prix HT non modifiable) : seuls facturés.
 * On choisit l'article dans la liste, la quantité et éventuellement une promotion en cours (remise sur la ligne) ;
 * ou on importe un devis du client.
 */
export default function ArticlesCard({
  intervention,
  catalog,
  quotes,
  promotions,
  readOnly = false,
}: {
  intervention: Intervention
  /** Articles actifs du catalogue. */
  catalog: Article[]
  /** Devis du client, importables (une fois chacun). */
  quotes: GarageQuoteSummary[]
  /** Promotions en cours aujourd'hui. */
  promotions: Promotion[]
  /** Intervention facturée : plus de modification. */
  readOnly?: boolean
}) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const repository = new InterventionApiRepository(api)

  const [selected, setSelected] = useState<Article | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [promotionId, setPromotionId] = useState('')
  const [editing, setEditing] = useState<{ id: number; quantity: string; promotionId: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  // Article absent du catalogue en cours de saisie : ajouté au catalogue puis à l'intervention.
  // articleId : déjà créé au catalogue (si l'ajout à l'intervention a échoué, on ne le recrée pas).
  const [creating, setCreating] = useState<{
    name: string
    description: string
    price: string
    quantity: string
    promotionId: string
    articleId?: number
  } | null>(null)

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
      () => new AddInterventionArticle(repository).execute(intervention.id, selected.id, toNumber(quantity), promotionId ? Number(promotionId) : null),
      () => {
        setSelected(null)
        setQuantity('1')
        setPromotionId('')
      },
    )
  }

  function startCreating(name = '') {
    setError('')
    setSelected(null)
    setCreating({ name, description: '', price: '', quantity: '1', promotionId: '' })
  }

  /** Nouvel article : enregistré au catalogue (comme dans la page Articles), puis ajouté à l'intervention. */
  function addNew(e: FormEvent) {
    e.preventDefault()
    if (!creating) return
    const form = creating
    run(async () => {
      const articleId =
        form.articleId ??
        (await new CreateArticle(new ArticleApiRepository(api)).execute({
          name: form.name,
          description: form.description,
          unitPriceHt: toNumber(form.price),
        }))
      setCreating((c) => c && { ...c, articleId })
      await new AddInterventionArticle(repository).execute(
        intervention.id,
        articleId,
        toNumber(form.quantity),
        form.promotionId ? Number(form.promotionId) : null,
      )
    }, () => setCreating(null))
  }

  function save() {
    if (!editing) return
    run(
      () =>
        new UpdateInterventionArticle(repository).execute(
          intervention.id,
          editing.id,
          toNumber(editing.quantity),
          editing.promotionId ? Number(editing.promotionId) : null,
        ),
      () => setEditing(null),
    )
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

      {!readOnly && creating && (
        <form onSubmit={addNew} className="mt-3 space-y-3 rounded-brand border border-zinc-200 bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Nouvel article</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-64 flex-1">
              <span className="mb-1 block text-xs font-semibold text-zinc-500">Nom</span>
              <input
                autoFocus
                value={creating.name}
                onChange={(e) => setCreating({ ...creating, name: e.target.value })}
                maxLength={200}
                placeholder="Indiquez le nom de l'article"
                className={`${input} bg-white`}
              />
            </label>
            <label className="w-44">
              <span className="mb-1 block text-xs font-semibold text-zinc-500">Prix unitaire HT (€)</span>
              <input
                inputMode="decimal"
                value={creating.price}
                onChange={(e) => setCreating({ ...creating, price: e.target.value })}
                placeholder="Indiquez le prix HT"
                className={`${input} bg-white text-right`}
              />
            </label>
            <label className="w-24">
              <span className="mb-1 block text-xs font-semibold text-zinc-500">Quantité</span>
              <input
                inputMode="decimal"
                value={creating.quantity}
                onChange={(e) => setCreating({ ...creating, quantity: e.target.value })}
                className={`${input} bg-white text-right`}
              />
            </label>
            {promotions.length > 0 && (
              <label className="w-60">
                <span className="mb-1 block text-xs font-semibold text-zinc-500">Promotion</span>
                <PromotionSelect promotions={promotions} value={creating.promotionId} onChange={(value) => setCreating({ ...creating, promotionId: value })} />
              </label>
            )}
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-zinc-500">Description (facultative)</span>
            <textarea
              value={creating.description}
              onChange={(e) => setCreating({ ...creating, description: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Indiquez les opérations réalisées, une par ligne"
              className={`${input} bg-white`}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">L'article est enregistré dans le catalogue des articles, puis ajouté à l'intervention.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCreating(null)} className="rounded-brand border border-zinc-300 bg-white px-4 py-1.5 font-semibold">
                Annuler
              </button>
              <button type="submit" disabled={busy} className="rounded-brand bg-secondary px-4 py-1.5 font-semibold text-on-secondary disabled:opacity-40">
                Ajouter
              </button>
            </div>
          </div>
        </form>
      )}

      {!readOnly && !creating && (
        <form onSubmit={add} className="mt-3 flex flex-wrap items-end gap-2">
          {/* div et non label : le lien « Nouvel article » ne doit pas devenir le champ du libellé. */}
          <div className="min-w-64 flex-1 text-sm">
            <span className="mb-1 flex justify-between text-xs font-semibold text-zinc-500">
              Article
              <button type="button" onClick={() => startCreating()} className="font-semibold text-primary hover:underline">
                + Nouvel article
              </button>
            </span>
            <ArticleSearch catalog={catalog} selected={selected} onSelect={setSelected} onCreate={startCreating} />
          </div>
          <label className="w-24 text-sm">
            <span className="mb-1 block text-xs font-semibold text-zinc-500">Quantité</span>
            <input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${input} text-right`} />
          </label>
          {promotions.length > 0 && (
            <label className="w-60 text-sm">
              <span className="mb-1 block text-xs font-semibold text-zinc-500">Promotion</span>
              <PromotionSelect promotions={promotions} value={promotionId} onChange={setPromotionId} />
            </label>
          )}
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
                  {editing?.id === a.id ? (
                    <div className="mt-2 max-w-72">
                      <PromotionSelect
                        promotions={promotions}
                        value={editing.promotionId}
                        onChange={(value) => setEditing({ ...editing, promotionId: value })}
                        current={a}
                      />
                    </div>
                  ) : (
                    a.discountPercent !== null && (
                      <span className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                        {a.promotionTitle} {percent(a.discountPercent)}
                      </span>
                    )
                  )}
                </td>
                <td className="py-2 pr-2 text-right">
                  {editing?.id === a.id ? (
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={editing.quantity}
                      onChange={(e) => setEditing({ ...editing, quantity: e.target.value })}
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
                          onClick={() =>
                            setEditing({
                              id: a.id,
                              quantity: String(a.quantity).replace('.', ','),
                              promotionId: a.promotionId === null ? '' : String(a.promotionId),
                            })
                          }
                          className="text-zinc-600 hover:underline"
                        >
                          Modifier
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
