import { ApiError, AppointmentApiRepository, CustomerApiRepository, VehicleApiRepository } from '@atelio/core/data'
import {
  BookAppointment,
  CreateCustomer,
  GetCustomerVehicles,
  isValidPlate,
  MAX_NOTES_LENGTH,
  ValidationError,
  type CustomerSummary,
  type CustomerVehicle,
  type Garage,
  type Service,
} from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'
import CustomerSearch from '../customers/CustomerSearch'
import { endLabel } from './EndLabel'
import { hoursToMinutes, isValidEstimate } from './EstimateHours'
import SlotCheckMessage from './SlotCheckMessage'
import { useSlotCheck } from './useSlotCheck'

const startFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/** Heure locale du garage attendue par l'API : "2026-10-12T09:30". */
function localDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message
  if (error instanceof ApiError && error.status < 500) return error.message
  return "L'enregistrement a échoué. Vérifiez que l'API est démarrée puis réessayez."
}

/** "Autre véhicule" : saisie d'une immatriculation. */
const NEW_VEHICLE = 'new'

export default function NewAppointmentPanel({
  garage,
  services,
  start,
  onClose,
  onBooked,
}: {
  garage: Garage
  /** Prestations proposées par le garage. */
  services: Service[]
  start: Date
  onClose: () => void
  onBooked: (reference: string) => void
}) {
  const { api } = useBrand()

  // Client : trouvé par la recherche, ou nouvelle fiche à saisir.
  const [customer, setCustomer] = useState<CustomerSummary | null>(null)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', phone: '', email: '' })
  // Fiche créée lors d'un premier essai (ex. créneau refusé) : on ne la recrée pas.
  const [createdCustomerId, setCreatedCustomerId] = useState<number | null>(null)

  // Véhicule
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([])
  // Voiture choisie, saisie d'une autre, ou null (plusieurs voitures, pas encore choisie).
  const [vehicleChoice, setVehicleChoice] = useState<number | typeof NEW_VEHICLE | null>(NEW_VEHICLE)
  const [plate, setPlate] = useState('')

  const [serviceIds, setServiceIds] = useState<number[]>([])
  // Estimation facultative (heures), demandée pour une prestation sans durée.
  const [estimateHours, setEstimateHours] = useState('')
  const [notes, setNotes] = useState('')

  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const chosenServices = services.filter((s) => serviceIds.includes(s.id))
  const hasNoDuration = chosenServices.some((s) => s.durationMinutes === null)
  const typedEstimate = hasNoDuration && estimateHours.trim() !== ''
  const estimateValid = !typedEstimate || isValidEstimate(estimateHours)
  const estimatedMinutes = typedEstimate && estimateValid ? hoursToMinutes(estimateHours) : undefined

  async function selectCustomer(found: CustomerSummary) {
    setError('')
    setLoadingCustomer(true)
    try {
      const list = await new GetCustomerVehicles(new VehicleApiRepository(api)).execute(found.id)
      setCustomer(found)
      setVehicles(list)
      // Une seule voiture : présélectionnée. Plusieurs : le garagiste choisit.
      setVehicleChoice(list.length === 1 ? list[0].id : list.length === 0 ? NEW_VEHICLE : null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoadingCustomer(false)
    }
  }

  function backToSearch() {
    setCustomer(null)
    setCreatingCustomer(false)
    setVehicles([])
    setVehicleChoice(NEW_VEHICLE)
  }

  function toggleService(id: number) {
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]))
  }

  const hasVehicle = typeof vehicleChoice === 'number' || (vehicleChoice === NEW_VEHICLE && isValidPlate(plate))
  const hasCustomer = customer !== null || (creatingCustomer && !!newCustomer.firstName.trim() && !!newCustomer.lastName.trim() && !!newCustomer.phone.trim())
  // Disponibilité vérifiée dès que les prestations (donc la durée) sont connues.
  const slotCheck = useSlotCheck(
    serviceIds.length > 0 && estimateValid ? { garageId: garage.id, scheduledAt: localDateTime(start), serviceIds: [...serviceIds].sort(), estimatedMinutes } : null,
  )
  const canSubmit = hasCustomer && hasVehicle && estimateValid && slotCheck.status === 'available' && !submitting

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      let id = customer?.id ?? createdCustomerId
      if (id === null) {
        id = await new CreateCustomer(new CustomerApiRepository(api)).execute(newCustomer)
        setCreatedCustomerId(id)
      }
      const booked = await new BookAppointment(new AppointmentApiRepository(api)).execute({
        customerId: id,
        garageId: garage.id,
        serviceIds,
        estimatedMinutes,
        scheduledAt: localDateTime(start),
        vehicleId: typeof vehicleChoice === 'number' ? vehicleChoice : undefined,
        plate: vehicleChoice === NEW_VEHICLE ? plate : undefined,
        customerNotes: notes || undefined,
      })
      onBooked(booked.reference)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SidePanel
      title="Nouveau rendez-vous"
      subtitle={
        <>
          <p className="first-letter:uppercase">
            {startFormat.format(start)}
            {slotCheck.status === 'available' && slotCheck.estimatedEndAt &&
              ` – ${endLabel(start, new Date(slotCheck.estimatedEndAt))}`}
          </p>
          <p className="text-zinc-500">{garage.name}</p>
        </>
      }
      onClose={onClose}
      footer={
        <form onSubmit={submit}>
          {error && <p className="mb-3 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-primary">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-brand bg-secondary px-5 py-2 text-sm font-semibold text-on-secondary disabled:opacity-40"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      }
    >
          {/* Client */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Client</h3>
            <div className="mt-3">
              {customer ? (
                <div className="flex items-start justify-between gap-3 rounded-brand bg-muted px-3 py-2 text-sm">
                  <p>
                    <span className="block font-semibold">
                      {customer.firstName} {customer.lastName}
                    </span>
                    <span className="block text-zinc-500">{[customer.phone, customer.email].filter(Boolean).join(' · ')}</span>
                  </p>
                  <button type="button" onClick={backToSearch} className="shrink-0 font-semibold text-primary hover:underline">
                    Changer
                  </button>
                </div>
              ) : creatingCustomer ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Prénom" value={newCustomer.firstName} disabled={createdCustomerId !== null} placeholder="Indiquez le prénom" onChange={(v) => setNewCustomer({ ...newCustomer, firstName: v })} />
                    <Field label="Nom" value={newCustomer.lastName} disabled={createdCustomerId !== null} placeholder="Indiquez le nom" onChange={(v) => setNewCustomer({ ...newCustomer, lastName: v })} />
                  </div>
                  <Field label="Téléphone" type="tel" value={newCustomer.phone} disabled={createdCustomerId !== null} placeholder="Indiquez le téléphone" onChange={(v) => setNewCustomer({ ...newCustomer, phone: v })} />
                  <Field label="E-mail (facultatif)" type="email" value={newCustomer.email} disabled={createdCustomerId !== null} placeholder="Indiquez l'e-mail" onChange={(v) => setNewCustomer({ ...newCustomer, email: v })} />
                  {createdCustomerId === null && (
                    <button type="button" onClick={backToSearch} className="text-sm font-semibold text-primary hover:underline">
                      ← Rechercher un client
                    </button>
                  )}
                </div>
              ) : (
                <CustomerSearch
                  disabled={loadingCustomer}
                  onSelect={(c) => void selectCustomer(c)}
                  onNewCustomer={() => {
                    setCreatingCustomer(true)
                    setError('')
                  }}
                />
              )}
            </div>
          </section>

          {/* Véhicule */}
          {(customer !== null || creatingCustomer) && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Véhicule</h3>
              <div className="mt-3 space-y-2">
                {vehicles.map((v) => (
                  <Choice key={v.id} checked={vehicleChoice === v.id} onSelect={() => setVehicleChoice(v.id)}>
                    <span className="font-mono font-semibold tracking-wider">{v.plate}</span>
                    {(v.make || v.model) && <span className="text-zinc-500"> · {[v.make, v.model].filter(Boolean).join(' ')}</span>}
                  </Choice>
                ))}
                {vehicles.length > 0 && (
                  <Choice checked={vehicleChoice === NEW_VEHICLE} onSelect={() => setVehicleChoice(NEW_VEHICLE)}>
                    Autre véhicule
                  </Choice>
                )}
                {vehicleChoice === NEW_VEHICLE && (
                  <Field label="Immatriculation" value={plate} onChange={(v) => setPlate(v.toUpperCase())} placeholder="Indiquez l'immatriculation" />
                )}
              </div>
            </section>
          )}

          {/* Prestations */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Prestations</h3>
            <div className="mt-3 space-y-2">
              {services.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-brand border border-zinc-200 px-3 py-2 text-sm hover:border-zinc-300">
                  <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} className="accent-secondary" />
                  <span className="flex-1">{s.name}</span>
                  {s.durationMinutes !== null && <span className="text-zinc-500">{formatDuration(s.durationMinutes)}</span>}
                </label>
              ))}
            </div>
            {hasNoDuration && (
              <label className="mt-4 block text-sm font-semibold">
                Votre estimation (en heures, facultatif)
                <input
                  inputMode="decimal"
                  value={estimateHours}
                  onChange={(e) => setEstimateHours(e.target.value)}
                  placeholder="Indiquez le temps estimé"
                  className="mt-1 w-full rounded-brand border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-primary"
                />
                {!estimateValid && <span className="mt-1 block text-xs font-normal text-red-700">Indiquez un temps entre 1 minute et 200 heures, par exemple 1,5.</span>}
                {!typedEstimate && (
                  <span className="mt-1 block rounded-brand bg-amber-50 px-3 py-2 text-xs font-normal text-amber-800">
                    ⚠ Sans estimation, le rendez-vous est enregistré à cette heure, sans bloquer le planning du mécanicien.
                  </span>
                )}
              </label>
            )}
            <SlotCheckMessage check={slotCheck} />
          </section>

          {/* Message */}
          <section>
            <label htmlFor="appointment-notes" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Message <span className="font-normal normal-case tracking-normal">(facultatif)</span>
            </label>
            <textarea
              id="appointment-notes"
              rows={3}
              maxLength={MAX_NOTES_LENGTH}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-3 w-full rounded-brand border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </section>
    </SidePanel>
  )
}

function Choice({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={`block w-full rounded-brand border-2 px-3 py-2 text-left text-sm transition-colors ${
        checked ? 'border-secondary bg-muted' : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary disabled:bg-muted"
      />
    </label>
  )
}
