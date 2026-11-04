import { CustomerApiRepository } from '@atelio/core/data'
import { GetCustomers, type CustomerSummary } from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { useBrand } from '../../brand/useBrand'
import LoadingState from '../../components/LoadingState'
import { useDebounced } from '../../lib/useDebounced'

/** Clients proposés au plus : le garagiste précise sa recherche au-delà. */
const MAX_RESULTS = 10

type SearchState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; customers: CustomerSummary[] }

/** Recherche d'un client par nom, immatriculation ou téléphone, ou passage à la saisie d'un nouveau client. */
export default function CustomerSearch({
  disabled = false,
  onSelect,
  onNewCustomer,
  onSearchChange,
}: {
  /** Résultats inactifs (ex. pendant le chargement du client choisi). */
  disabled?: boolean
  onSelect: (customer: CustomerSummary) => void
  onNewCustomer: () => void
  onSearchChange?: () => void
}) {
  const { api } = useBrand()
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<{ key: string; state: SearchState } | null>(null)
  const debounced = useDebounced(search).trim()

  useEffect(() => {
    if (!debounced) return
    let current = true
    new GetCustomers(new CustomerApiRepository(api))
      .execute({ search: debounced, page: 1, pageSize: MAX_RESULTS })
      .then((page): SearchState => ({ status: 'ok', customers: page.items }))
      .catch((): SearchState => ({ status: 'error' }))
      .then((state) => {
        if (current) setResult({ key: debounced, state })
      })
    return () => {
      current = false
    }
  }, [api, debounced])

  // Résultat d'une recherche précédente : on attend celui de la recherche en cours.
  const state: SearchState | null = !debounced ? null : result?.key === debounced ? result.state : { status: 'loading' }

  return (
    <div>
      <input
        autoFocus
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          onSearchChange?.()
        }}
        placeholder="Indiquez le nom, l'immatriculation ou le téléphone"
        aria-label="Rechercher un client"
        className="w-full rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button type="button" onClick={onNewCustomer} className="mt-1 text-sm font-semibold text-primary hover:underline">
        + Nouveau client
      </button>

      {state?.status === 'loading' && <LoadingState message="Recherche…" />}
      {state?.status === 'error' && <p className="mt-2 text-sm text-red-700">La recherche a échoué, réessayez.</p>}
      {state?.status === 'ok' && state.customers.length === 0 && <p className="mt-2 text-sm text-zinc-500">Aucun client ne correspond.</p>}
      {state?.status === 'ok' && state.customers.length > 0 && (
        <ul className="mt-2 divide-y divide-zinc-100">
          {state.customers.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(c)}
                className="w-full px-2 py-3 text-left text-sm hover:bg-muted disabled:opacity-50"
              >
                <span className="block font-semibold">
                  {c.firstName} {c.lastName}
                </span>
                <span className="block text-zinc-500">{[c.phone, c.plates].filter(Boolean).join(' · ') || 'Aucun téléphone ni véhicule'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
