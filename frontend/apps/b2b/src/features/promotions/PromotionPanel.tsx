import { ApiError, PromotionApiRepository } from '@atelio/core/data'
import { CreatePromotion, localIsoDate, UpdatePromotion, ValidationError, type Promotion, type Service } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'

const input = 'w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary'
const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** "4,5" ou "4.5" => 4.5 ; vide ou invalide => NaN. */
function toNumber(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(',', '.'))
}

/** Ajout (promotion null) ou modification d'une promotion. */
export default function PromotionPanel({
  promotion,
  services,
  onClose,
  onSaved,
}: {
  promotion: Promotion | null
  services: Service[]
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { api } = useBrand()
  const [serviceId, setServiceId] = useState(promotion ? String(promotion.serviceId) : '')
  const [title, setTitle] = useState(promotion?.title ?? '')
  const [description, setDescription] = useState(promotion?.description ?? '')
  const [discount, setDiscount] = useState(promotion ? String(promotion.discountPercent).replace('.', ',') : '')
  const [startsOn, setStartsOn] = useState(promotion?.startsOn ?? localIsoDate())
  const [endsOn, setEndsOn] = useState(promotion?.endsOn ?? '')
  const [conditions, setConditions] = useState(promotion?.conditions ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // La prestation d'une promotion existante reste proposée même si elle n'est plus active.
  const options =
    promotion && !services.some((s) => s.id === promotion.serviceId)
      ? [{ id: promotion.serviceId, name: promotion.serviceName, price: promotion.servicePrice }, ...services]
      : services
  const service = options.find((s) => String(s.id) === serviceId)
  const percent = toNumber(discount)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const input = {
      serviceId: Number(serviceId),
      title,
      description,
      discountPercent: percent,
      startsOn,
      endsOn: endsOn || null,
      conditions,
    }
    const repository = new PromotionApiRepository(api)
    try {
      if (promotion) {
        await new UpdatePromotion(repository).execute(promotion.id, input)
        onSaved(`Promotion « ${title.trim()} » modifiée.`)
      } else {
        await new CreatePromotion(repository).execute(input)
        onSaved(`Promotion « ${title.trim()} » ajoutée.`)
      }
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
      setBusy(false)
    }
  }

  return (
    <SidePanel
      title={promotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
      subtitle={promotion ? 'Les articles déjà remisés sur les interventions gardent leur remise.' : undefined}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold">
            Annuler
          </button>
          <button
            type="submit"
            form="promotion-form"
            disabled={busy}
            className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      }
    >
      <form id="promotion-form" onSubmit={submit} className="space-y-5 text-sm">
        <label className="block">
          <span className="mb-1 block font-semibold">Prestation</span>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={input}>
            <option value="">Choisir une prestation…</option>
            {options.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-zinc-500">L'offre renvoie vers cette prestation sur le site.</span>
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Titre</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Indiquez le titre de la promotion" maxLength={150} className={input} />
        </label>
        <div className="flex items-end gap-4">
          <label className="block w-44">
            <span className="mb-1 block font-semibold">Remise (%)</span>
            <input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Indiquez la remise" className={`${input} text-right`} />
          </label>
          {service && percent > 0 && percent <= 100 && (
            <p className="pb-2 text-zinc-600">
              Sur le site : <span className="line-through">{euro.format(service.price)}</span>{' '}
              <span className="font-semibold text-zinc-900">{euro.format(Math.round(service.price * (100 - percent)) / 100)}</span> TTC
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block font-semibold">Début</span>
            <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold">Fin (facultative)</span>
            <input type="date" value={endsOn} min={startsOn} onChange={(e) => setEndsOn(e.target.value)} className={input} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block font-semibold">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Indiquez la description de l'offre"
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Conditions</span>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Indiquez les conditions de l'offre"
            className={input}
          />
          <span className="mt-1 block text-xs text-zinc-500">Petit texte affiché sous l'offre.</span>
        </label>
        {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      </form>
    </SidePanel>
  )
}
