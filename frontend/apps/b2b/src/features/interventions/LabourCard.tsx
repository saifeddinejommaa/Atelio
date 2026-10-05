import { ApiError, InterventionApiRepository } from '@atelio/core/data'
import {
  labourPrice,
  UpdateServiceLabour,
  ValidationError,
  type Intervention,
  type InterventionService,
  type ServiceCategory,
} from '@atelio/core/domain'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/use-brand'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

/**
 * Main-d'œuvre : chaque prestation = taux horaire de sa catégorie × temps.
 * Prestation à durée incertaine (« Autre ») : l'accueil saisit le temps passé et le type indiqués par le mécanicien.
 */
export default function LabourCard({
  intervention,
  categories,
  readOnly = false,
}: {
  intervention: Intervention
  categories: ServiceCategory[]
  /** Intervention facturée : plus de modification. */
  readOnly?: boolean
}) {
  const totalMinutes = intervention.services.reduce((sum, s) => sum + s.durationMinutes * s.quantity, 0)

  return (
    <section className="rounded-brand bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Main-d'œuvre</h2>
      <ul className="mt-3 divide-y divide-zinc-100">
        {intervention.services.map((s) => (
          <ServiceLine key={s.serviceId} interventionId={intervention.id} service={s} categories={categories} readOnly={readOnly} />
        ))}
      </ul>
      {totalMinutes > 0 && (
        <p className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-600">Temps total : {formatDuration(totalMinutes)}</p>
      )}
    </section>
  )
}

function ServiceLine({
  interventionId,
  service: s,
  categories,
  readOnly,
}: {
  interventionId: number
  service: InterventionService
  categories: ServiceCategory[]
  readOnly: boolean
}) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const [editing, setEditing] = useState(false)
  const [minutes, setMinutes] = useState(String(s.durationMinutes))
  const [categoryId, setCategoryId] = useState(s.categoryId ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const rate = categories.find((c) => c.id === categoryId)?.hourlyRate
  const preview = rate !== undefined && Number(minutes) > 0 ? labourPrice(rate, Number(minutes)) : null

  async function save() {
    setSaving(true)
    setError('')
    try {
      await new UpdateServiceLabour(new InterventionApiRepository(api)).execute(interventionId, s.serviceId, Number(minutes), categoryId)
      await revalidator.revalidate()
      setEditing(false)
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-secondary">●</span>
        <span className="font-medium">
          {s.name}
          {s.quantity > 1 && <span className="text-zinc-500"> × {s.quantity}</span>}
        </span>
        <span className="text-xs text-zinc-500">{s.categoryName ?? 'Type à préciser'}</span>
        <span className="ml-auto text-sm text-zinc-600">
          {formatDuration(s.durationMinutes)}
          {s.hourlyRate !== null && ` × ${euro.format(s.hourlyRate)}/h`}
          {' = '}
          <span className="font-semibold text-foreground">{euro.format(s.unitPrice * s.quantity)}</span>
        </span>
      </div>

      {s.uncertainDuration && !editing && !readOnly && (
        <button type="button" onClick={() => setEditing(true)} className="ml-5 mt-1 text-sm font-semibold text-primary hover:underline">
          Saisir le temps passé et le type
        </button>
      )}

      {editing && (
        <div className="ml-5 mt-2 rounded-brand bg-muted p-3">
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <label className="block">
              <span className="text-zinc-600">Temps passé (min)</span>
              <input
                type="number"
                min={5}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="mt-1 block w-28 rounded-brand border border-zinc-300 bg-white px-2 py-1.5 outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-zinc-600">Type</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="mt-1 block rounded-brand border border-zinc-300 bg-white px-2 py-1.5"
              >
                <option value={0}>— Choisir —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({euro.format(c.hourlyRate)}/h)
                  </option>
                ))}
              </select>
            </label>
            <span className="pb-2 text-zinc-600">= {preview !== null ? euro.format(preview) : '—'}</span>
          </div>
          {error && <p className="mt-2 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="rounded-brand bg-secondary px-4 py-1.5 text-sm font-semibold text-on-secondary disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-brand border border-zinc-300 bg-white px-4 py-1.5 text-sm font-semibold">
              Annuler
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
