import { ApiError, ManagedServiceApiRepository } from '@atelio/core/data'
import { DeleteService, SetServiceActive, type ManagedService } from '@atelio/core/domain'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useDeferredData } from '../../components/DeferredRoute'
import IconButton from '../../components/IconButton'
import { formatDuration } from './ServiceDuration'
import type { ServicesData } from './ServicesLoader'
import ServicePanel from './ServicePanel'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const percent = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

type Show = 'active' | 'inactive' | 'all'

const shows: [Show, string][] = [
  ['active', 'Actives'],
  ['inactive', 'Désactivées'],
  ['all', 'Toutes'],
]

/** Prestations de la marque : proposées sur le site et à la prise de rendez-vous tant qu'elles sont actives. */
export default function ServicesPage() {
  const { services, categories } = useDeferredData<ServicesData>()
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const [show, setShow] = useState<Show>('active')
  // Prestation ouverte dans le panneau : 'new' pour un ajout.
  const [editing, setEditing] = useState<ManagedService | 'new' | null>(null)
  // Prestation dont la suppression attend confirmation.
  const [deleting, setDeleting] = useState<ManagedService | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const visible = services.filter((s) => show === 'all' || s.isActive === (show === 'active'))

  function notify(message: string) {
    setConfirmation(message)
    setTimeout(() => setConfirmation(''), 5000)
  }

  async function act(service: ManagedService, action: () => Promise<void>, message?: string) {
    setBusy(service.id)
    setError('')
    try {
      await action()
      if (message) notify(message)
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : 'La modification a échoué, réessayez.')
    } finally {
      // Fenêtre de suppression refermée dans tous les cas : l'éventuelle erreur s'affiche sur la page.
      setDeleting(null)
      setBusy(null)
    }
  }

  async function saved(message: string) {
    setEditing(null)
    notify(message)
    await revalidator.revalidate()
  }

  const repository = new ManagedServiceApiRepository(api)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Prestations</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Proposées sur le site et à la prise de rendez-vous. Désactivée, une prestation n'apparaît plus sur le site.
          </p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
          + Nouvelle prestation
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-brand bg-muted p-1 text-sm font-semibold">
        {shows.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={show === value}
            onClick={() => setShow(value)}
            className={`rounded-brand px-4 py-1.5 ${show === value ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-brand bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Prestation</th>
              <th className="w-44 px-4 py-3">Type d'intervention</th>
              <th className="w-36 px-4 py-3 text-right">À partir de (TTC)</th>
              <th className="w-28 px-4 py-3 text-right">Durée</th>
              <th className="w-28 px-4 py-3">État</th>
              <th className="w-32 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visible.map((s) => (
              <tr key={s.id} className={`align-top ${s.isActive ? '' : 'text-zinc-400'}`}>
                <td className="px-4 py-3">
                  <span className="font-semibold">{s.name}</span>
                  {s.description && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{s.description}</p>}
                </td>
                <td className="px-4 py-3">{s.categoryName ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  {s.discountPercent !== null ? (
                    <>
                      <span className="font-medium">{euro.format(s.finalPrice)}</span>
                      <span className="block text-xs text-zinc-500">
                        <span className="line-through">{euro.format(s.price)}</span> · promo -{percent.format(s.discountPercent)} %
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">{euro.format(s.price)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatDuration(s.durationMinutes)}
                  {s.uncertainDuration && <span className="block text-xs text-zinc-500">incertaine</span>}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}
                  >
                    {s.isActive ? 'Active' : 'Désactivée'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <IconButton icon="edit" label="Modifier" onClick={() => setEditing(s)} />
                    <IconButton
                      icon={s.isActive ? 'disable' : 'enable'}
                      label={s.isActive ? 'Désactiver' : 'Réactiver'}
                      disabled={busy === s.id}
                      onClick={() => act(s, () => new SetServiceActive(repository).execute(s.id, !s.isActive))}
                    />
                    <IconButton
                      icon="delete"
                      label="Supprimer"
                      onClick={() => {
                        setError('')
                        setDeleting(s)
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            {services.length === 0 ? 'Aucune prestation : ajoutez la première avec « Nouvelle prestation ».' : 'Aucune prestation dans cette liste.'}
          </p>
        )}
      </div>

      {deleting && (
        <ConfirmDialog
          title={`Voulez-vous supprimer la prestation « ${deleting.name} » ?`}
          message="Elle disparaîtra du site et de tous les garages. Cette action est définitive."
          busy={busy === deleting.id}
          onConfirm={() => act(deleting, () => new DeleteService(repository).execute(deleting.id), `Prestation « ${deleting.name} » supprimée.`)}
          onCancel={() => setDeleting(null)}
        />
      )}

      {editing && (
        <ServicePanel
          key={editing === 'new' ? 'new' : editing.id}
          service={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}

      {confirmation && (
        <p role="status" className="fixed bottom-6 right-6 z-50 rounded-brand bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {confirmation}
        </p>
      )}
    </>
  )
}
