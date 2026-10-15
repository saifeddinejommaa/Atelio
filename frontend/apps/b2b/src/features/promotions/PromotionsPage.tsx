import { ApiError, PromotionApiRepository } from '@atelio/core/data'
import { localIsoDate, promotionState, SetPromotionActive, type Promotion, type PromotionState } from '@atelio/core/domain'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import type { PromotionsData } from './PromotionsLoader'
import IconButton from '../../components/IconButton'
import PromotionPanel from './PromotionPanel'
import { useDeferredData } from '../../components/DeferredRoute'

const qty = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const day = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** "2026-10-13" => "13/10/2026". */
function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return day.format(new Date(y, m - 1, d))
}

type Show = PromotionState | 'all'

const shows: [Show, string][] = [
  ['current', 'En cours'],
  ['upcoming', 'À venir'],
  ['ended', 'Terminées'],
  ['inactive', 'Désactivées'],
  ['all', 'Toutes'],
]

const states: Record<PromotionState, [string, string]> = {
  current: ['En cours', 'bg-emerald-50 text-emerald-700'],
  upcoming: ['À venir', 'bg-sky-50 text-sky-700'],
  ended: ['Terminée', 'bg-zinc-100 text-zinc-500'],
  inactive: ['Désactivée', 'bg-zinc-100 text-zinc-500'],
}

/**
 * Promotions de la marque : remise en % sur une prestation, affichée sur le site pendant sa période,
 * et à appliquer sur les lignes d'articles des interventions.
 */
export default function PromotionsPage() {
  const { promotions, services } = useDeferredData<PromotionsData>()
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const [show, setShow] = useState<Show>('current')
  // Promotion ouverte dans le panneau : 'new' pour un ajout.
  const [editing, setEditing] = useState<Promotion | 'new' | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const today = localIsoDate()
  const visible = promotions.filter((p) => show === 'all' || promotionState(p, today) === show)

  async function toggle(promotion: Promotion) {
    setBusy(promotion.id)
    setError('')
    try {
      await new SetPromotionActive(new PromotionApiRepository(api)).execute(promotion.id, !promotion.isActive)
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : 'La modification a échoué, réessayez.')
    } finally {
      setBusy(null)
    }
  }

  async function saved(message: string) {
    setEditing(null)
    setConfirmation(message)
    setTimeout(() => setConfirmation(''), 5000)
    await revalidator.revalidate()
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Promotions</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Affichées sur le site (« Offres du moment ») pendant leur période, et applicables aux articles des interventions.
          </p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
          + Nouvelle promotion
        </button>
      </div>

      <div className="mt-6 flex flex-wrap rounded-brand bg-muted p-1 text-sm font-semibold sm:inline-flex">
        {shows.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={show === value}
            onClick={() => setShow(value)}
            className={`rounded-brand px-4 py-1.5 ${show === value ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-brand bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Promotion</th>
              <th className="px-4 py-3">Prestation</th>
              <th className="w-24 px-4 py-3 text-right">Remise</th>
              <th className="w-48 px-4 py-3">Période</th>
              <th className="w-28 px-4 py-3">État</th>
              <th className="w-28 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visible.map((p) => {
              const [label, style] = states[promotionState(p, today)]
              return (
                <tr key={p.id} className={`align-top ${p.isActive ? '' : 'text-zinc-400'}`}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{p.title}</span>
                    {p.conditions && <p className="mt-0.5 text-xs text-zinc-500">{p.conditions}</p>}
                  </td>
                  <td className="px-4 py-3">{p.serviceName}</td>
                  <td className="px-4 py-3 text-right font-semibold">-{qty.format(p.discountPercent)} %</td>
                  <td className="px-4 py-3">
                    {p.endsOn ? `Du ${formatDay(p.startsOn)} au ${formatDay(p.endsOn)}` : `Dès le ${formatDay(p.startsOn)}, sans fin`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton icon="edit" label="Modifier" onClick={() => setEditing(p)} />
                      <IconButton
                        icon={p.isActive ? 'disable' : 'enable'}
                        label={p.isActive ? 'Désactiver' : 'Réactiver'}
                        disabled={busy === p.id}
                        onClick={() => toggle(p)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            {promotions.length === 0 ? 'Aucune promotion : ajoutez la première avec « Nouvelle promotion ».' : 'Aucune promotion dans cette liste.'}
          </p>
        )}
      </div>

      {editing && (
        <PromotionPanel
          key={editing === 'new' ? 'new' : editing.id}
          promotion={editing === 'new' ? null : editing}
          services={services}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}

      {confirmation && (
        <p role="status" className="fixed bottom-6 right-6 z-50 rounded-brand bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {confirmation}
        </p>
      )}
    </>
  )
}
