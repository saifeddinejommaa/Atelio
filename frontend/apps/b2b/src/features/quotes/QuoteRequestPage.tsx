import { useState } from 'react'
import { Link } from 'react-router'
import { useDeferredData } from '../../components/DeferredRoute'
import NewQuotePanel from './NewQuotePanel'
import type { QuoteRequestData } from './QuoteRequestLoader'

const dateTime = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Demande de devis d'un client : le garagiste la consulte et établit le devis. */
export default function QuoteRequestPage() {
  const { request, vehicles, catalog } = useDeferredData<QuoteRequestData>()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <Link to="/devis" className="text-sm text-zinc-500 hover:underline">
        ← Demandes de devis
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Demande de devis</h1>
        {request.quoteId ? (
          <Link to={`/devis/${request.quoteId}`} className="rounded-brand border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:border-primary">
            Voir le devis {request.quoteNumber}
          </Link>
        ) : (
          <button type="button" onClick={() => setCreating(true)} className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
            Créer le devis
          </button>
        )}
      </div>

      <dl className="mt-6 grid gap-4 rounded-brand bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
        <Info label="Reçue le">{dateTime.format(new Date(request.createdAt))}</Info>
        <Info label="Client">
          <Link to={`/clients/${request.customerId}`} className="font-semibold text-primary hover:underline">
            {request.customerFirstName} {request.customerLastName}
          </Link>
        </Info>
        <Info label="E-mail">{request.customerEmail ?? '—'}</Info>
        <Info label="Téléphone">{request.customerPhone ?? '—'}</Info>
        <Info label="Immatriculation">{request.vehiclePlate}</Info>
        <Info label="Prestations souhaitées">{request.services}</Info>
        {request.message && (
          <div className="sm:col-span-2">
            <dt className="font-semibold text-zinc-500">Message</dt>
            <dd className="mt-1 whitespace-pre-line">{request.message}</dd>
          </div>
        )}
      </dl>

      {creating && (
        <NewQuotePanel
          customerId={request.customerId}
          vehicles={vehicles}
          catalog={catalog}
          quoteRequestId={request.id}
          initialVehicleId={request.vehicleId}
          onClose={() => setCreating(false)}
        />
      )}
    </>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-zinc-500">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
