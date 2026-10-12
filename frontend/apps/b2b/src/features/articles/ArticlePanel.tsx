import { ApiError, ArticleApiRepository } from '@atelio/core/data'
import { CreateArticle, UpdateArticle, ValidationError, type Article } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'

const input = 'w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary'

/** "4,5" ou "4.5" => 4.5 ; vide ou invalide => NaN. */
function toNumber(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(',', '.'))
}

/** Ajout (article null) ou modification d'un article du catalogue. */
export default function ArticlePanel({
  article,
  onClose,
  onSaved,
}: {
  article: Article | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { api } = useBrand()
  const [name, setName] = useState(article?.name ?? '')
  const [description, setDescription] = useState(article?.description ?? '')
  const [price, setPrice] = useState(article ? String(article.unitPriceHt).replace('.', ',') : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const input = { name, description, unitPriceHt: toNumber(price) }
    const repository = new ArticleApiRepository(api)
    try {
      if (article) {
        await new UpdateArticle(repository).execute(article.id, input)
        onSaved(`Article « ${name.trim()} » modifié.`)
      } else {
        await new CreateArticle(repository).execute(input)
        onSaved(`Article « ${name.trim()} » ajouté.`)
      }
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
      setBusy(false)
    }
  }

  return (
    <SidePanel
      title={article ? 'Modifier l\'article' : 'Nouvel article'}
      subtitle={article ? 'Les interventions déjà renseignées gardent l\'ancien nom et l\'ancien prix.' : undefined}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold">
            Annuler
          </button>
          <button
            type="submit"
            form="article-form"
            disabled={busy}
            className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      }
    >
      <form id="article-form" onSubmit={submit} className="space-y-5 text-sm">
        <label className="block">
          <span className="mb-1 block font-semibold">Nom</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Huile moteur" maxLength={200} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            maxLength={2000}
            placeholder={'- Changement de l\'huile moteur 5W30\n- Changement du filtre à huile\n- Nettoyage des durites'}
            className={input}
          />
          <span className="mt-1 block text-xs text-zinc-500">Une opération par ligne. Affichée sur l'intervention et sur la facture.</span>
        </label>
        <label className="block w-40">
          <span className="mb-1 block font-semibold">Prix unitaire HT (€)</span>
          <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className={`${input} text-right`} />
        </label>
        {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      </form>
    </SidePanel>
  )
}
