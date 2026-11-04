import type { QuoteRequest } from '@atelio/core/domain'
import { useState } from 'react'
import { Link } from 'react-router'
import { useDeferredData } from '../../components/DeferredRoute'
import NewQuoteSearchPanel from './NewQuoteSearchPanel'

const dateTime = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Demandes de devis des clients : à traiter d'abord, puis les plus récentes. */
export default function QuoteRequestsPage() {
  const requests = useDeferredData<QuoteRequest[]>()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Demandes de devis</h1>
        <button type="button" onClick={() => setCreating(true)} className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
          + Nouveau devis
        </button>
      </div>
      {requests.length === 0 ? (
        <p className="mt-6 rounded-brand bg-white p-6 text-sm text-zinc-500 shadow-sm">Aucune demande de devis.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-brand bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Immatriculation</th>
                <th className="px-4 py-3 font-semibold">Prestations</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link to={`/devis/demandes/${r.id}`} className="font-semibold text-primary hover:underline">
                      {dateTime.format(new Date(r.createdAt))}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {r.customerFirstName} {r.customerLastName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{r.vehiclePlate}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.services}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {r.quoteSentAt ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Envoyé · {r.quoteNumber}</span>
                    ) : r.quoteId ? (
                      <span className="rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800">Traité · {r.quoteNumber}</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">À traiter</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <NewQuoteSearchPanel onClose={() => setCreating(false)} />}
    </>
  )
}
