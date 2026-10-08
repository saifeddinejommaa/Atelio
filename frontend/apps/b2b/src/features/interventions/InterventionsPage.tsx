import { InterventionApiRepository } from '@atelio/core/data'
import {
  GetInterventions,
  InterventionStatus,
  pageCount,
  type InterventionSummary,
  type Page,
  type StatusOption,
} from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { Link, useLoaderData } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import { useCurrentGarage } from '../../garage/useCurrentGarage'
import { interventionStatusClasses } from './InterventionStatus'

const PAGE_SIZE = 20

const dateTime = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

type ListState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; page: Page<InterventionSummary> }

/** Valeur saisie, prise en compte après une courte pause de frappe. */
function useDebounced(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Interventions du garage, 20 par page : filtres client, immatriculation, jour de début
 * et statut (table intervention_status).
 */
export default function InterventionsPage() {
  const { api } = useBrand()
  const garage = useCurrentGarage()
  // Statuts actifs de la table, plus « Toutes » (0).
  const statuses = useLoaderData<StatusOption<InterventionStatus>[]>().filter((s) => s.isActive)

  const [status, setStatus] = useState<InterventionStatus | 0>(InterventionStatus.InProgress)
  const [customer, setCustomer] = useState('')
  const [plate, setPlate] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{ key: string; state: ListState } | null>(null)

  const debouncedCustomer = useDebounced(customer)
  const debouncedPlate = useDebounced(plate)

  const key = `${garage.id}|${status}|${debouncedCustomer}|${debouncedPlate}|${date}|${page}`
  useEffect(() => {
    let current = true
    new GetInterventions(new InterventionApiRepository(api))
      .execute({
        garageId: garage.id,
        statusId: status || undefined,
        customer: debouncedCustomer,
        plate: debouncedPlate,
        date,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((page): ListState => ({ status: 'ok', page }))
      .catch((): ListState => ({ status: 'error' }))
      .then((state) => {
        if (current) setResult({ key, state })
      })
    return () => {
      current = false
    }
  }, [api, garage.id, status, debouncedCustomer, debouncedPlate, date, page, key])

  const state: ListState = result?.state ?? { status: 'loading' }
  const filtered = customer !== '' || plate !== '' || date !== '' || status !== 0

  // Tout changement de filtre repart de la première page.
  function filter(apply: () => void) {
    apply()
    setPage(1)
  }

  function reset() {
    filter(() => {
      setCustomer('')
      setPlate('')
      setDate('')
      setStatus(0)
    })
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Interventions</h1>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-brand bg-white p-4 shadow-sm">
        <Field label="Client">
          <input
            type="search"
            value={customer}
            onChange={(e) => filter(() => setCustomer(e.target.value))}
            placeholder="Nom ou prénom"
            className={input}
          />
        </Field>
        <Field label="Immatriculation">
          <input
            type="search"
            value={plate}
            onChange={(e) => filter(() => setPlate(e.target.value.toUpperCase()))}
            placeholder="AB-123-CD"
            className={`${input} font-mono`}
          />
        </Field>
        <Field label="Date d'intervention">
          <input type="date" value={date} onChange={(e) => filter(() => setDate(e.target.value))} className={input} />
        </Field>
        <Field label="Statut">
          <div className="flex rounded-brand bg-muted p-1 text-sm font-semibold">
            {[...statuses, { id: 0 as const, label: 'Toutes' }].map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={status === s.id}
                onClick={() => filter(() => setStatus(s.id))}
                className={`rounded-brand px-3 py-1.5 ${status === s.id ? 'bg-primary text-on-primary' : 'text-zinc-600 hover:bg-white'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        {filtered && (
          <button type="button" onClick={reset} className="pb-2 text-sm font-semibold text-zinc-600 hover:underline">
            Effacer les filtres
          </button>
        )}
      </div>

      <div className={`mt-4 overflow-hidden rounded-brand bg-white shadow-sm ${result?.key !== key ? 'opacity-60' : ''}`}>
        {state.status === 'loading' && <p className="p-6 text-sm text-zinc-500">Chargement…</p>}
        {state.status === 'error' && <p className="p-6 text-sm text-red-700">Les interventions n'ont pas pu être chargées.</p>}
        {state.status === 'ok' && state.page.items.length === 0 && (
          <p className="p-6 text-sm text-zinc-500">Aucune intervention ne correspond à ces filtres.</p>
        )}
        {state.status === 'ok' && state.page.items.length > 0 && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Début</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {state.page.items.map((i) => (
                  <tr key={i.id} className="hover:bg-muted">
                    <td className="px-4 py-3">
                      <Link to={`/interventions/${i.id}`} className="font-mono font-semibold hover:underline">
                        {i.reference ?? `N°${i.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {i.customerFirstName} {i.customerLastName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{i.vehiclePlate}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${interventionStatusClasses[i.status.id]}`}>
                        {i.status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{i.startedAt ? dateTime.format(new Date(i.startedAt)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={state.page} onChange={setPage} />
          </>
        )}
      </div>
    </>
  )
}

const input = 'w-48 rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

/** Pages à afficher : la première, la dernière, la courante et ses voisines ; « … » entre les trous. */
function pageNumbers(current: number, count: number): (number | '…')[] {
  const pages = [...new Set([1, current - 1, current, current + 1, count])].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? (['…', p] as const) : [p]))
}

/** « 21–40 sur 134 interventions » et ‹ 1 2 3 … 7 ›. */
function Pagination({ page, onChange }: { page: Page<InterventionSummary>; onChange: (page: number) => void }) {
  const count = pageCount(page)
  const first = (page.page - 1) * page.pageSize + 1
  const last = Math.min(page.page * page.pageSize, page.total)
  const button = 'flex h-8 min-w-8 items-center justify-center rounded-brand px-2 text-sm font-semibold'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3">
      <p className="text-sm text-zinc-600">
        {first}–{last} sur {page.total} intervention{page.total > 1 ? 's' : ''}
      </p>
      {count > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Page précédente"
            disabled={page.page === 1}
            onClick={() => onChange(page.page - 1)}
            className={`${button} text-zinc-600 hover:bg-muted disabled:opacity-30`}
          >
            ‹
          </button>
          {pageNumbers(page.page, count).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1 text-zinc-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page.page ? 'page' : undefined}
                onClick={() => onChange(p)}
                className={`${button} ${p === page.page ? 'bg-primary text-on-primary' : 'text-zinc-700 hover:bg-muted'}`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Page suivante"
            disabled={page.page === count}
            onClick={() => onChange(page.page + 1)}
            className={`${button} text-zinc-600 hover:bg-muted disabled:opacity-30`}
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
