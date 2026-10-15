import { InvoiceApiRepository } from '@atelio/core/data'
import { GetInvoice, GetInvoices, InvoiceStatus, ValidationError, type Invoice, type InvoicePage } from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import Pagination from '../../components/Pagination'
import { useCurrentGarage } from '../../garage/useCurrentGarage'
import { useDebounced } from '../../lib/useDebounced'
import InvoicePdfViewer from './InvoicePdfViewer'
import LoadingState from '../../components/LoadingState'

const PAGE_SIZE = 20

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const statusClasses: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: 'bg-zinc-100 text-zinc-600',
  [InvoiceStatus.Issued]: 'bg-amber-50 text-amber-800',
  [InvoiceStatus.Paid]: 'bg-emerald-50 text-emerald-700',
  [InvoiceStatus.PartiallyPaid]: 'bg-amber-50 text-amber-800',
  [InvoiceStatus.Cancelled]: 'bg-zinc-100 text-zinc-500',
}

type PreviewState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; invoice: Invoice }

type ListState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; page: InvoicePage }

const input = 'rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary'

/**
 * Factures du garage, 20 par page : période d'émission (du / au), client, immatriculation.
 * Liste à gauche, aperçu de la facture choisie à droite (imprimable).
 */
export default function InvoicesPage() {
  const { api } = useBrand()
  const garage = useCurrentGarage()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [customer, setCustomer] = useState('')
  const [plate, setPlate] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{ key: string; state: ListState } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [preview, setPreview] = useState<{ id: number; state: PreviewState } | null>(null)
  // Incrémenté pour recharger la facture affichée (ex. après la génération de son PDF).
  const [reload, setReload] = useState(0)

  const debouncedCustomer = useDebounced(customer)
  const debouncedPlate = useDebounced(plate)

  const key = `${garage.id}|${from}|${to}|${debouncedCustomer}|${debouncedPlate}|${page}`
  useEffect(() => {
    let current = true
    new GetInvoices(new InvoiceApiRepository(api))
      .execute({ garageId: garage.id, from, to, customer: debouncedCustomer, plate: debouncedPlate, page, pageSize: PAGE_SIZE })
      .then((page): ListState => ({ status: 'ok', page }))
      .catch((err): ListState => ({
        status: 'error',
        message: err instanceof ValidationError ? err.message : "Les factures n'ont pas pu être chargées.",
      }))
      .then((state) => {
        if (current) setResult({ key, state })
      })
    return () => {
      current = false
    }
  }, [api, garage.id, from, to, debouncedCustomer, debouncedPlate, page, key])

  const state: ListState = result?.state ?? { status: 'loading' }
  // Facture affichée : celle choisie si elle est dans la page, sinon la première de la page.
  const items = state.status === 'ok' ? state.page.items : []
  const shownId = items.some((i) => i.id === selectedId) ? selectedId : (items[0]?.id ?? null)

  useEffect(() => {
    if (shownId === null) return
    let current = true
    new GetInvoice(new InvoiceApiRepository(api))
      .execute(shownId)
      .then((invoice): PreviewState => (invoice ? { status: 'ok', invoice } : { status: 'error' }))
      .catch((): PreviewState => ({ status: 'error' }))
      .then((state) => {
        if (current) setPreview({ id: shownId, state })
      })
    return () => {
      current = false
    }
  }, [api, shownId, reload])

  const previewState: PreviewState = preview?.id === shownId ? preview.state : { status: 'loading' }
  const filtered = from !== '' || to !== '' || customer !== '' || plate !== ''

  // Tout changement de filtre repart de la première page.
  function filter(apply: () => void) {
    apply()
    setPage(1)
  }

  // Grand écran : page à la hauteur de l'écran, titre et recherche fixes ; la liste et l'aperçu défilent chacun de leur côté.
  return (
    <div className="flex flex-col lg:h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Factures</h1>
        <p className="mt-1 text-sm text-zinc-500">Factures émises par {garage.name}.</p>
      </div>

      <section aria-label="Recherche" className="mt-6 flex flex-wrap items-end gap-3 rounded-brand bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">Du</span>
          <input type="date" value={from} max={to || undefined} onChange={(e) => filter(() => setFrom(e.target.value))} className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">Au</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => filter(() => setTo(e.target.value))} className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">Client</span>
          <input value={customer} onChange={(e) => filter(() => setCustomer(e.target.value))} placeholder="Indiquez le nom ou le prénom" className={`${input} w-56`} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-zinc-500">Véhicule</span>
          <input value={plate} onChange={(e) => filter(() => setPlate(e.target.value))} placeholder="Indiquez l'immatriculation" className={`${input} w-48`} />
        </label>
        {filtered && (
          <button
            type="button"
            onClick={() =>
              filter(() => {
                setFrom('')
                setTo('')
                setCustomer('')
                setPlate('')
              })
            }
            className="pb-2 text-sm text-zinc-500 hover:underline"
          >
            Effacer les filtres
          </button>
        )}
      </section>

      <div className="mt-4 grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-stretch">
        <section aria-label="Liste des factures" className="flex min-h-0 flex-col overflow-hidden rounded-brand bg-white shadow-sm">
          {state.status === 'loading' && <LoadingState message="Chargement des factures…" />}
          {state.status === 'error' && <p className="px-4 py-6 text-sm text-red-700">{state.message}</p>}
          {state.status === 'ok' && items.length === 0 && (
            <p className="px-4 py-6 text-sm text-zinc-500">{filtered ? 'Aucune facture ne correspond.' : 'Aucune facture.'}</p>
          )}
          {state.status === 'ok' && items.length > 0 && (
            <>
              <ul data-striped className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">
                {items.map((i) => {
                  const active = i.id === shownId
                  return (
                    <li key={i.id}>
                      <button
                        type="button"
                        aria-current={active || undefined}
                        onClick={() => setSelectedId(i.id)}
                        className={`block w-full border-l-4 px-4 py-3 text-left text-sm ${active ? 'border-primary bg-muted' : 'border-transparent hover:bg-muted/50'}`}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-mono font-semibold">{i.number}</span>
                          <span className="font-semibold">{euro.format(i.totalTtc)}</span>
                        </div>
                        <div className="mt-0.5 flex items-baseline justify-between gap-3 text-zinc-600">
                          <span className="truncate">
                            {i.customerFirstName} {i.customerLastName} · <span className="font-mono text-xs">{i.vehiclePlate}</span>
                          </span>
                          <span className="whitespace-nowrap text-xs">{date.format(new Date(i.issuedAt))}</span>
                        </div>
                        <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[i.status.id]}`}>
                          {i.status.label}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <Pagination page={state.page} onChange={setPage} noun={['facture', 'factures']} />
            </>
          )}
        </section>

        <section aria-label="Aperçu de la facture" className="min-h-0 lg:overflow-y-auto">
          {shownId !== null && previewState.status === 'loading' && (
            <div className="rounded-brand bg-white shadow-sm">
              <LoadingState message="Chargement de la facture…" />
            </div>
          )}
          {shownId !== null && previewState.status === 'error' && (
            <p className="rounded-brand bg-white px-4 py-6 text-sm text-red-700 shadow-sm">La facture n'a pas pu être chargée.</p>
          )}
          {previewState.status === 'ok' && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                <Link
                  to={`/clients/${items.find((i) => i.id === shownId)?.customerId}`}
                  className="rounded-brand border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:border-primary"
                >
                  Fiche client
                </Link>
                <Link
                  to={`/interventions/${previewState.invoice.interventionId}`}
                  className="rounded-brand border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:border-primary"
                >
                  Intervention
                </Link>
              </div>
              <InvoicePdfViewer
                key={previewState.invoice.id}
                invoice={previewState.invoice}
                height="calc(100vh - 19rem)"
                onChanged={() => setReload((n) => n + 1)}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
