import { ApiError, ArticleApiRepository } from '@atelio/core/data'
import { SetArticleActive, type Article } from '@atelio/core/domain'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import IconButton from '../../components/IconButton'
import ArticlePanel from './ArticlePanel'
import { useDeferredData } from '../../components/DeferredRoute'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

type Show = 'active' | 'inactive' | 'all'

const shows: [Show, string][] = [
  ['active', 'Actifs'],
  ['inactive', 'Désactivés'],
  ['all', 'Tous'],
]

/** Recherche sans tenir compte des majuscules ni des accents. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Catalogue d'articles de la marque (prix HT), importés ensuite sur les interventions. */
export default function ArticlesPage() {
  const articles = useDeferredData<Article[]>()
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const [search, setSearch] = useState('')
  const [show, setShow] = useState<Show>('active')
  // Article ouvert dans le panneau : 'new' pour un ajout.
  const [editing, setEditing] = useState<Article | 'new' | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const query = normalize(search.trim())
  const visible = articles.filter(
    (a) => (show === 'all' || a.isActive === (show === 'active')) && (!query || normalize(a.name).includes(query)),
  )

  async function toggle(article: Article) {
    setBusy(article.id)
    setError('')
    try {
      await new SetArticleActive(new ArticleApiRepository(api)).execute(article.id, !article.isActive)
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : "La modification a échoué, réessayez.")
    } finally {
      setBusy(null)
    }
  }

  async function saved(message: string) {
    setEditing(null)
    setConfirmation(message)
    setTimeout(() => setConfirmation(''), 5000)
    await revalidator.revalidate()
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Articles</h1>
          <p className="mt-1 text-sm text-zinc-500">Catalogue commun à tous les garages, prix HT. Les articles s'ajoutent ensuite aux interventions.</p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
          + Nouvel article
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom…"
          aria-label="Rechercher un article"
          className="w-72 rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex rounded-brand bg-muted p-1 text-sm font-semibold">
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
      </div>

      {error && <p className="mt-4 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-brand bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="w-32 px-4 py-3 text-right">Prix HT</th>
              <th className="w-28 px-4 py-3">État</th>
              <th className="w-28 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {visible.map((a) => (
              <tr key={a.id} className={`align-top ${a.isActive ? '' : 'text-zinc-400'}`}>
                <td className="px-4 py-3">
                  <span className="font-semibold">{a.name}</span>
                  {a.description && <p className="mt-0.5 whitespace-pre-line text-xs text-zinc-500">{a.description}</p>}
                </td>
                <td className="px-4 py-3 text-right font-medium">{euro.format(a.unitPriceHt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}
                  >
                    {a.isActive ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <IconButton icon="edit" label="Modifier" onClick={() => setEditing(a)} />
                    <IconButton
                      icon={a.isActive ? 'disable' : 'enable'}
                      label={a.isActive ? 'Désactiver' : 'Réactiver'}
                      disabled={busy === a.id}
                      onClick={() => toggle(a)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            {articles.length === 0 ? 'Aucun article : ajoutez le premier avec « Nouvel article ».' : 'Aucun article ne correspond.'}
          </p>
        )}
      </div>

      {editing && (
        <ArticlePanel
          key={editing === 'new' ? 'new' : editing.id}
          article={editing === 'new' ? null : editing}
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
