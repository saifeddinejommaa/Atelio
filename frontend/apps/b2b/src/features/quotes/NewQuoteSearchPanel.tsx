import { ApiError, ArticleApiRepository, CustomerApiRepository, VehicleApiRepository } from '@atelio/core/data'
import {
  AddCustomerVehicle,
  CreateCustomer,
  GetArticles,
  GetCustomerVehicles,
  ValidationError,
  type Article,
  type CustomerSummary,
  type CustomerVehicle,
} from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'
import CustomerSearch from '../customers/CustomerSearch'
import NewQuotePanel from './NewQuotePanel'

const input = 'mt-1 w-full rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary'

type Chosen = { customerId: number; name: string; vehicles: CustomerVehicle[]; catalog: Article[] }

const emptyCustomer = { firstName: '', lastName: '', phone: '', email: '', plate: '' }

function errorMessage(err: unknown): string {
  return err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez."
}

/**
 * Nouveau devis depuis la page Devis : recherche du client (nom, immatriculation ou téléphone)
 * ou saisie d'un nouveau client avec son véhicule, puis saisie du devis.
 */
export default function NewQuoteSearchPanel({ onClose }: { onClose: () => void }) {
  const { api } = useBrand()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [chosen, setChosen] = useState<Chosen | null>(null)
  const [creating, setCreating] = useState(false)
  const [customer, setCustomer] = useState(emptyCustomer)
  // Client créé : un nouvel essai après une erreur sur le véhicule ne le crée pas une seconde fois.
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [plate, setPlate] = useState('')

  async function load(customerId: number, name: string) {
    const [vehicles, catalog] = await Promise.all([
      new GetCustomerVehicles(new VehicleApiRepository(api)).execute(customerId),
      new GetArticles(new ArticleApiRepository(api)).execute({ active: true }),
    ])
    setChosen({ customerId, name, vehicles, catalog })
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function submitCustomer(e: FormEvent) {
    e.preventDefault()
    void run(async () => {
      const { plate: customerPlate, ...details } = customer
      const id = createdId ?? (await new CreateCustomer(new CustomerApiRepository(api)).execute(details))
      setCreatedId(id)
      await new AddCustomerVehicle(new VehicleApiRepository(api)).execute(id, customerPlate)
      await load(id, `${details.firstName} ${details.lastName}`.trim())
    })
  }

  function submitPlate(e: FormEvent) {
    e.preventDefault()
    if (!chosen) return
    void run(async () => {
      await new AddCustomerVehicle(new VehicleApiRepository(api)).execute(chosen.customerId, plate)
      await load(chosen.customerId, chosen.name)
    })
  }

  if (chosen && chosen.vehicles.length > 0) {
    return <NewQuotePanel customerId={chosen.customerId} vehicles={chosen.vehicles} catalog={chosen.catalog} onClose={onClose} />
  }

  if (creating) {
    return (
      <SidePanel title="Nouveau devis" subtitle="Nouveau client" onClose={onClose}>
        <form onSubmit={submitCustomer} className="space-y-4 text-sm">
          <label className="block font-semibold">
            Prénom
            <input autoFocus required disabled={createdId !== null} value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} placeholder="Indiquez le prénom" className={input} />
          </label>
          <label className="block font-semibold">
            Nom
            <input required disabled={createdId !== null} value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} placeholder="Indiquez le nom" className={input} />
          </label>
          <label className="block font-semibold">
            Téléphone
            <input required type="tel" disabled={createdId !== null} value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Indiquez le téléphone" className={input} />
          </label>
          <label className="block font-semibold">
            E-mail
            <input type="email" disabled={createdId !== null} value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="Indiquez l'e-mail" className={input} />
            <span className="mt-1 block text-xs font-normal text-zinc-500">Facultatif, mais nécessaire pour envoyer le devis par e-mail.</span>
          </label>
          <label className="block font-semibold">
            Immatriculation
            <input required value={customer.plate} onChange={(e) => setCustomer({ ...customer, plate: e.target.value.toUpperCase() })} placeholder="Indiquez l'immatriculation" className={input} />
          </label>
          {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" disabled={createdId !== null} onClick={() => setCreating(false)} className="rounded-brand border border-zinc-300 px-4 py-2 font-semibold disabled:opacity-40">
              Retour
            </button>
            <button type="submit" disabled={busy} className="rounded-brand bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-40">
              {busy ? 'Enregistrement…' : 'Continuer'}
            </button>
          </div>
        </form>
      </SidePanel>
    )
  }

  return (
    <SidePanel title="Nouveau devis" subtitle="Recherchez le client" onClose={onClose}>
      <CustomerSearch
        disabled={busy}
        onSelect={(c: CustomerSummary) => void run(() => load(c.id, `${c.firstName} ${c.lastName}`.trim()))}
        onNewCustomer={() => {
          setCreating(true)
          setError('')
        }}
        onSearchChange={() => {
          setChosen(null)
          setError('')
        }}
      />

      {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {chosen && (
        <form onSubmit={submitPlate} className="space-y-2 rounded-brand bg-amber-50 p-3 text-sm text-amber-900">
          <p>{chosen.name} n'a pas de véhicule enregistré. Ajoutez son immatriculation pour établir le devis.</p>
          <input required value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Indiquez l'immatriculation" aria-label="Immatriculation" className={input} />
          <button type="submit" disabled={busy} className="rounded-brand bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-40">
            {busy ? 'Enregistrement…' : 'Continuer'}
          </button>
        </form>
      )}
    </SidePanel>
  )
}
