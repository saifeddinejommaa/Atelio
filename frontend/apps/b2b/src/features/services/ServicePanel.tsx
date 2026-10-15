import { ApiError, ManagedServiceApiRepository } from '@atelio/core/data'
import { CreateService, UpdateService, ValidationError, type ManagedService, type ServiceCategory } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'
import { formatDuration } from './ServiceDuration'

const input = 'w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary'

/** "4,5" ou "4.5" => 4.5 ; vide ou invalide => NaN. */
function toNumber(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(',', '.'))
}

/** Ajout (service null) ou modification d'une prestation. */
export default function ServicePanel({
  service,
  categories,
  onClose,
  onSaved,
}: {
  service: ManagedService | null
  categories: ServiceCategory[]
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { api } = useBrand()
  const [name, setName] = useState(service?.name ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [price, setPrice] = useState(service ? String(service.price).replace('.', ',') : '')
  const [duration, setDuration] = useState(service ? String(service.durationMinutes) : '')
  const [categoryId, setCategoryId] = useState(service?.categoryId ? String(service.categoryId) : '')
  const [uncertain, setUncertain] = useState(service?.uncertainDuration ?? false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const minutes = toNumber(duration)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const input = {
      name,
      description,
      price: toNumber(price),
      durationMinutes: minutes,
      categoryId: categoryId ? Number(categoryId) : null,
      uncertainDuration: uncertain,
    }
    const repository = new ManagedServiceApiRepository(api)
    try {
      if (service) {
        await new UpdateService(repository).execute(service.id, input)
        onSaved(`Prestation « ${name.trim()} » modifiée.`)
      } else {
        await new CreateService(repository).execute(input)
        onSaved(`Prestation « ${name.trim()} » ajoutée.`)
      }
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
      setBusy(false)
    }
  }

  return (
    <SidePanel
      title={service ? 'Modifier la prestation' : 'Nouvelle prestation'}
      subtitle={
        service
          ? 'Les rendez-vous et interventions déjà enregistrés gardent l\'ancien prix.'
          : 'Elle sera proposée sur le site et dans tous les garages de la marque.'
      }
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold">
            Annuler
          </button>
          <button
            type="submit"
            form="service-form"
            disabled={busy}
            className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      }
    >
      <form id="service-form" onSubmit={submit} className="space-y-5 text-sm">
        <label className="block">
          <span className="mb-1 block font-semibold">Nom</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Indiquez le nom de la prestation" maxLength={150} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Indiquez la description affichée sur le site"
            className={input}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block font-semibold">Prix à partir de (€ TTC)</span>
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Indiquez le prix TTC" className={`${input} text-right`} />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold">Durée (minutes)</span>
            <input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Indiquez la durée" className={`${input} text-right`} />
            {Number.isInteger(minutes) && minutes > 0 && <span className="mt-1 block text-xs text-zinc-500">Soit {formatDuration(minutes)}</span>}
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block font-semibold">Type d'intervention</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={input}>
            <option value="">Aucun</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.hourlyRate} €/h TTC)
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-zinc-500">Donne le taux horaire de la main-d'œuvre.</span>
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={uncertain} onChange={(e) => setUncertain(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
          <span>
            <span className="font-semibold">Durée incertaine</span>
            <span className="block text-xs text-zinc-500">Temps à préciser par le mécanicien ; le rendez-vous est placé de préférence le matin.</span>
          </span>
        </label>
        {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      </form>
    </SidePanel>
  )
}
