import { CustomerApiRepository } from '@atelio/core/data'
import { GetCustomers, type CustomerSummary, type Page } from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import Pagination from '../../components/Pagination'
import { useDebounced } from '../../lib/useDebounced'
import LoadingState from '../../components/LoadingState'

const PAGE_SIZE = 20

const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

type ListState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; page: Page<CustomerSummary> }

/** Clients de la marque, 20 par page, recherchés par nom, e-mail, téléphone ou immatriculation. */
export default function CustomersPage() {
  const { api } = useBrand()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<{ key: string; state: ListState } | null>(null)
  const debounced = useDebounced(search)

  const key = `${debounced}|${page}`
  useEffect(() => {
    let current = true
    new GetCustomers(new CustomerApiRepository(api))
      .execute({ search: debounced, page, pageSize: PAGE_SIZE })
      .then((page): ListState => ({ status: 'ok', page }))
      .catch((): ListState => ({ status: 'error' }))
      .then((state) => {
        if (current) setResult({ key, state })
      })
    return () => {
      current = false
    }
  }, [api, debounced, page, key])

  const state: ListState = result?.state ?? { status: 'loading' }

  // Page à la hauteur de l'écran (moins les marges du contenu) : seule la liste défile, pagination visible.
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-zinc-500">Fiche client : coordonnées, véhicules et factures.</p>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Nom, e-mail, téléphone ou immatriculation…"
        aria-label="Rechercher un client"
        className="mt-6 w-full max-w-md rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
      />

      <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-brand bg-white shadow-sm">
        {state.status === 'loading' && <LoadingState message="Chargement des clients…" />}
        {state.status === 'error' && <p className="px-4 py-6 text-sm text-red-700">Les clients n'ont pas pu être chargés.</p>}
        {state.status === 'ok' && state.page.items.length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">{search ? 'Aucun client ne correspond.' : 'Aucun client.'}</p>
        )}
        {state.status === 'ok' && state.page.items.length > 0 && (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-white text-left text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Dernière visite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {state.page.items.map((c) => (
                    <tr
                      key={c.id}
                      // Toute la ligne ouvre la fiche client.
                      onClick={() => navigate(`/clients/${c.id}`)}
                      className={`cursor-pointer hover:bg-muted/50 ${c.isActive ? '' : 'text-zinc-400'}`}
                    >
                      <td className="px-4 py-3">
                        <Link to={`/clients/${c.id}`} className="font-semibold hover:underline">
                          {c.lastName.toUpperCase()} {c.firstName}
                        </Link>
                        {!c.isActive && <span className="ml-2 text-xs">(désactivé)</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {c.phone && <div>{c.phone}</div>}
                        {c.email && <div className="text-xs">{c.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{c.lastVisitAt ? date.format(new Date(c.lastVisitAt)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={state.page} onChange={setPage} noun={['client', 'clients']} />
          </>
        )}
      </div>
    </div>
  )
}
