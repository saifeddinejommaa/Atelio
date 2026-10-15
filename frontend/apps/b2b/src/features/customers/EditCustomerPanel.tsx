import { ApiError, CustomerApiRepository } from '@atelio/core/data'
import { UpdateCustomer, ValidationError, type Customer } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'

const input = 'w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary'

/** Coordonnées du client : nom, prénom, téléphone, e-mail (facultatif, unique). */
export default function EditCustomerPanel({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer
  onClose: () => void
  onSaved: () => void
}) {
  const { api } = useBrand()
  const [firstName, setFirstName] = useState(customer.firstName)
  const [lastName, setLastName] = useState(customer.lastName)
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await new UpdateCustomer(new CustomerApiRepository(api)).execute(customer.id, { firstName, lastName, phone, email })
      onSaved()
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
      setBusy(false)
    }
  }

  return (
    <SidePanel
      title="Coordonnées du client"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold">
            Annuler
          </button>
          <button
            type="submit"
            form="customer-form"
            disabled={busy}
            className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      }
    >
      <form id="customer-form" onSubmit={submit} className="space-y-4 text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-semibold">Prénom</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold">Nom</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} className={input} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block font-semibold">Téléphone</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">
            E-mail <span className="font-normal text-zinc-500">· facultatif, sert à envoyer les devis</span>
          </span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} className={input} />
        </label>
        {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      </form>
    </SidePanel>
  )
}
