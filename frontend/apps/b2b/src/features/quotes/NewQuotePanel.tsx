import { ApiError, QuoteApiRepository } from '@atelio/core/data'
import { articleTotal, CreateQuote, ValidationError, VAT_RATE, type Article, type CustomerVehicle } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'
import { useCurrentGarage } from '../../garage/useCurrentGarage'
import ArticleSearch from '../articles/ArticleSearch'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const input = 'w-full rounded-brand border border-zinc-300 px-2 py-1.5 outline-none focus:border-primary'

type Line = { article: Article; quantity: string }

/** "4,5" ou "4.5" => 4.5 ; vide ou invalide => NaN. */
function toNumber(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(',', '.'))
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Nouveau devis pour un véhicule du client : articles du catalogue (prix HT non modifiables) et quantités.
 * Le garage courant établit le devis. Une fois créé, il s'ouvre pour être imprimé ou envoyé par e-mail.
 */
export default function NewQuotePanel({
  customerId,
  vehicles,
  catalog,
  onClose,
}: {
  customerId: number
  vehicles: CustomerVehicle[]
  /** Articles actifs du catalogue. */
  catalog: Article[]
  onClose: () => void
}) {
  const { api } = useBrand()
  const garage = useCurrentGarage()
  const navigate = useNavigate()
  const [vehicleId, setVehicleId] = useState(vehicles.length === 1 ? vehicles[0].id : 0)
  const [lines, setLines] = useState<Line[]>([])
  const [selected, setSelected] = useState<Article | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const totalHt = round2(lines.reduce((sum, l) => sum + (Number.isFinite(toNumber(l.quantity)) ? articleTotal({ quantity: toNumber(l.quantity), unitPriceHt: l.article.unitPriceHt }) : 0), 0))
  const vat = round2(totalHt * VAT_RATE)

  function add(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLines([...lines, { article: selected, quantity }])
    setSelected(null)
    setQuantity('1')
  }

  async function create() {
    setBusy(true)
    setError('')
    try {
      const id = await new CreateQuote(new QuoteApiRepository(api)).execute({
        customerId,
        vehicleId,
        garageId: garage.id,
        lines: lines.map((l) => ({ articleId: l.article.id, quantity: toNumber(l.quantity) })),
      })
      navigate(`/devis/${id}`)
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
      setBusy(false)
    }
  }

  return (
    <SidePanel
      title="Nouveau devis"
      subtitle={`Établi par ${garage.name}`}
      wide
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-zinc-500">Total HT</span> <strong>{euro.format(totalHt)}</strong>
            <span className="ml-3 text-zinc-500">TTC</span> <strong>{euro.format(round2(totalHt + vat))}</strong>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold">
              Annuler
            </button>
            <button
              type="button"
              disabled={busy || lines.length === 0 || !vehicleId}
              onClick={create}
              className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
            >
              {busy ? 'Création…' : 'Créer le devis'}
            </button>
          </div>
        </div>
      }
    >
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Véhicule</span>
        {vehicles.length === 0 ? (
          <p className="text-zinc-500">Ce client n'a pas de véhicule enregistré.</p>
        ) : (
          <select value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value))} className={`${input} bg-white`}>
            <option value={0} disabled>
              Choisir…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} {[v.make, v.model, v.version].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
        )}
      </label>

      <form onSubmit={add} className="flex flex-wrap items-end gap-2 text-sm">
        <label className="min-w-64 flex-1">
          <span className="mb-1 block font-semibold">Article</span>
          <ArticleSearch catalog={catalog} selected={selected} onSelect={setSelected} />
        </label>
        <label className="w-24">
          <span className="mb-1 block font-semibold">Quantité</span>
          <input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${input} text-right`} />
        </label>
        <button type="submit" disabled={!selected} className="rounded-brand bg-secondary px-4 py-1.5 font-semibold text-on-secondary disabled:opacity-40">
          Ajouter
        </button>
      </form>

      {lines.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun article pour l'instant.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="py-2 pr-2">Article</th>
              <th className="w-24 py-2 pr-2 text-right">Qté</th>
              <th className="w-24 py-2 pr-2 text-right">PU HT</th>
              <th className="w-24 py-2 pr-2 text-right">Total HT</th>
              <th className="w-16 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {lines.map((l, i) => {
              const q = toNumber(l.quantity)
              return (
                <tr key={i} className="align-top">
                  <td className="py-2 pr-2">
                    <span className="font-semibold">{l.article.name}</span>
                    {l.article.description && <p className="whitespace-pre-line text-xs text-zinc-500">{l.article.description}</p>}
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      inputMode="decimal"
                      value={l.quantity}
                      onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))}
                      aria-label="Quantité"
                      className={`${input} text-right`}
                    />
                  </td>
                  <td className="py-2 pr-2 text-right">{euro.format(l.article.unitPriceHt)}</td>
                  <td className="py-2 pr-2 text-right font-medium">
                    {Number.isFinite(q) ? euro.format(articleTotal({ quantity: q, unitPriceHt: l.article.unitPriceHt })) : '—'}
                  </td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-red-700 hover:underline">
                      Retirer
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </SidePanel>
  )
}
