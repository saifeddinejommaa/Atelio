import { ApiError, AppointmentApiRepository, CustomerApiRepository, VehicleApiRepository } from '@atelio/core/data'
import {
  BookAppointment,
  CreateCustomer,
  FindCustomersByPhone,
  GetCustomerVehicles,
  isValidPlate,
  MAX_NOTES_LENGTH,
  ValidationError,
  type Customer,
  type CustomerVehicle,
  type Garage,
  type Service,
} from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/use-brand'
import SidePanel from '../../components/SidePanel'
import SlotCheckMessage from './SlotCheckMessage'
import { useSlotCheck } from './use-slot-check'

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

  // Client : recherche par téléphone. null = pas encore cherché, [] = nouveau client.
  const [phone, setPhone] = useState('')
  const [customers, setCustomers] = useState<Customer[] | null>(null)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', email: '' })
  // Fiche créée lors d'un premier essai (ex. créneau refusé) : on ne la recrée pas.
  const [createdCustomerId, setCreatedCustomerId] = useState<number | null>(null)

  // Véhicule
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([])
  // Voiture choisie, saisie d'une autre, ou null (plusieurs voitures, pas encore choisie).
  const [vehicleChoice, setVehicleChoice] = useState<number | typeof NEW_VEHICLE | null>(NEW_VEHICLE)
  const [plate, setPlate] = useState('')

  const [serviceIds, setServiceIds] = useState<number[]>([])
  const [notes, setNotes] = useState('')

  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isNewCustomer = customers !== null && customers.length === 0
  const duration = services.filter((s) => serviceIds.includes(s.id)).reduce((sum, s) => sum + s.durationMinutes, 0)

  async function search(e?: FormEvent) {
    e?.preventDefault()
    setError('')
    setSearching(true)
    try {
      const found = await new FindCustomersByPhone(new CustomerApiRepository(api)).execute(phone)
      setCustomers(found)
      setCreatedCustomerId(null)
      if (found.length === 1) await selectCustomer(found[0].id)
      else {
        setCustomerId(null)
        setVehicles([])
        setVehicleChoice(NEW_VEHICLE)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  async function selectCustomer(id: number) {
    setCustomerId(id)
    const list = await new GetCustomerVehicles(new VehicleApiRepository(api)).execute(id)
    setVehicles(list)
    // Une seule voiture : présélectionnée. Plusieurs : le garagiste choisit.
    setVehicleChoice(list.length === 1 ? list[0].id : list.length === 0 ? NEW_VEHICLE : null)
  }

  function changePhone(value: string) {
    setPhone(value)
    // Nouveau numéro : il faut relancer la recherche.
    if (customers !== null) {
      setCustomers(null)
      setCustomerId(null)
      setVehicles([])
      setVehicleChoice(NEW_VEHICLE)
    }
  }

  function toggleService(id: number) {
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]))
  }

  const hasVehicle = typeof vehicleChoice === 'number' || (vehicleChoice === NEW_VEHICLE && isValidPlate(plate))
  const hasCustomer = customerId !== null || (isNewCustomer && !!newCustomer.firstName.trim() && !!newCustomer.lastName.trim())
  // Disponibilité vérifiée dès que les prestations (donc la durée) sont connues.
  const slotCheck = useSlotCheck(
    serviceIds.length > 0 ? { garageId: garage.id, scheduledAt: localDateTime(start), serviceIds: [...serviceIds].sort() } : null,
  )
  const canSubmit = hasCustomer && hasVehicle && slotCheck.status === 'available' && !submitting

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      let id = customerId ?? createdCustomerId
      if (id === null) {
        id = await new CreateCustomer(new CustomerApiRepository(api)).execute({ ...newCustomer, phone })
        setCreatedCustomerId(id)
      }
      const booked = await new BookAppointment(new AppointmentApiRepository(api)).execute({
        customerId: id,
        garageId: garage.id,
        serviceIds,
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
              ` – ${new Date(slotCheck.estimatedEndAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
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
            <form onSubmit={search} className="mt-3 flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => changePhone(e.target.value)}
                placeholder="Téléphone, ex. 06 12 34 56 78"
                aria-label="Téléphone du client"
                autoFocus
                className="min-w-0 flex-1 rounded-brand border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={searching || phone.replace(/\D/g, '').length < 9}
                className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
              >
                {searching ? '…' : 'Rechercher'}
              </button>
            </form>

            {customers !== null && customers.length > 1 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-zinc-600">{customers.length} clients ont ce numéro :</p>
                {customers.map((c) => (
                  <Choice key={c.id} checked={customerId === c.id} onSelect={() => selectCustomer(c.id)}>
                    {c.firstName} {c.lastName}
                    {c.email && <span className="block text-xs text-zinc-500">{c.email}</span>}
                  </Choice>
                ))}
              </div>
            )}

            {customers !== null && customers.length === 1 && (
              <p className="mt-3 rounded-brand bg-muted px-3 py-2 text-sm">
                <span className="font-semibold">
                  {customers[0].firstName} {customers[0].lastName}
                </span>
                {customers[0].email && <span className="text-zinc-500"> · {customers[0].email}</span>}
              </p>
            )}

            {isNewCustomer && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-zinc-600">Aucun client avec ce numéro : nouvelle fiche client.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" value={newCustomer.firstName} onChange={(v) => setNewCustomer({ ...newCustomer, firstName: v })} />
                  <Field label="Nom" value={newCustomer.lastName} onChange={(v) => setNewCustomer({ ...newCustomer, lastName: v })} />
                </div>
                {/* Correction du numéro sans relancer la recherche. */}
                <Field label="Téléphone" type="tel" value={phone} onChange={setPhone} />
                <Field
                  label="E-mail (facultatif)"
                  type="email"
                  value={newCustomer.email}
                  onChange={(v) => setNewCustomer({ ...newCustomer, email: v })}
                />
              </div>
            )}
          </section>

          {/* Véhicule */}
          {(customerId !== null || isNewCustomer) && (
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
                  <Field label="Immatriculation" value={plate} onChange={(v) => setPlate(v.toUpperCase())} placeholder="AB-123-CD" />
                )}
              </div>
            </section>
          )}

          {/* Prestations */}
          <section>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Prestations</h3>
              {duration > 0 && <span className="text-sm text-zinc-600">Durée : {formatDuration(duration)}</span>}
            </div>
            <div className="mt-3 space-y-2">
              {services.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-brand border border-zinc-200 px-3 py-2 text-sm hover:border-zinc-300">
                  <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} className="accent-secondary" />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-zinc-500">{formatDuration(s.durationMinutes)}</span>
                </label>
              ))}
            </div>
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block text-sm">
      <span className="text-zinc-600">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary"
      />
    </label>
  )
}
