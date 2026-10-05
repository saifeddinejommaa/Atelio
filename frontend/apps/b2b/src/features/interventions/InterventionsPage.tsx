import { InterventionApiRepository } from '@atelio/core/data'
import { GetInterventions, type InterventionStage, type InterventionSummary } from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useBrand } from '../../brand/use-brand'
import { useCurrentGarage } from '../../garage/use-current-garage'
import { interventionStages } from './intervention-status'

const dateTime = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

type ListState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; items: InterventionSummary[] }

/** Interventions du garage : recherche par référence ou client, filtre par étape. */
export default function InterventionsPage() {
  const { api } = useBrand()
  const garage = useCurrentGarage()
  const [status, setStatus] = useState<InterventionStage | ''>('in_progress')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [result, setResult] = useState<{ key: string; state: ListState } | null>(null)

  // Recherche lancée après une courte pause de frappe.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const key = `${garage.id}|${status}|${debounced}`
  useEffect(() => {
    let current = true
    new GetInterventions(new InterventionApiRepository(api))
      .execute({ garageId: garage.id, stage: status || undefined, search: debounced })
      .then((items): ListState => ({ status: 'ok', items }))
      .catch((): ListState => ({ status: 'error' }))
      .then((state) => {
        if (current) setResult({ key, state })
      })
    return () => {
      current = false
    }
  }, [api, garage.id, status, debounced, key])

  const state: ListState = result?.state ?? { status: 'loading' }

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Interventions</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Référence ou client"
          aria-label="Rechercher par référence ou client"
          className="w-72 rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex rounded-brand bg-white p-1 text-sm font-semibold shadow-sm">
          {(['in_progress', 'ready', 'invoiced', 'closed', ''] as const).map((s) => (
            <button
              key={s || 'all'}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-brand px-3 py-1.5 ${status === s ? 'bg-primary text-on-primary' : 'text-zinc-600 hover:bg-muted'}`}
            >
              {s ? interventionStages[s].label : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-4 overflow-hidden rounded-brand bg-white shadow-sm ${result?.key !== key ? 'opacity-60' : ''}`}>
        {state.status === 'loading' && <p className="p-6 text-sm text-zinc-500">Chargement…</p>}
        {state.status === 'error' && <p className="p-6 text-sm text-red-700">Les interventions n'ont pas pu être chargées.</p>}
        {state.status === 'ok' && state.items.length === 0 && <p className="p-6 text-sm text-zinc-500">Aucune intervention.</p>}
        {state.status === 'ok' && state.items.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Référence</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Début</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {state.items.map((i) => {
                const s = interventionStages[i.stage]
                return (
                  <tr key={i.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <Link to={`/interventions/${i.id}`} className="font-mono font-semibold hover:underline">
                        {i.reference ?? `N°${i.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {i.customerFirstName} {i.customerLastName}
                      <span className="ml-2 font-mono text-xs text-zinc-500">{i.vehiclePlate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{i.startedAt ? dateTime.format(new Date(i.startedAt)) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
