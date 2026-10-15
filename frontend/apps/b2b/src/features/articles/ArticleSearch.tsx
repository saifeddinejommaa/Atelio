import type { Article } from '@atelio/core/domain'
import { useState, type KeyboardEvent } from 'react'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const input = 'w-full rounded-brand border border-zinc-300 px-2 py-1.5 outline-none focus:border-primary'

/** Suggestions affichées au plus. */
const MAX_SUGGESTIONS = 8

/** Recherche sans tenir compte des majuscules ni des accents. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * Champ de recherche avec liste de suggestions (flèches, Entrée, Échap).
 * onCreate : propose aussi « Nouvel article » avec le texte saisi (article absent du catalogue).
 */
export default function ArticleSearch({
  catalog,
  selected,
  onSelect,
  onCreate,
}: {
  catalog: Article[]
  selected: Article | null
  onSelect: (article: Article | null) => void
  onCreate?: (name: string) => void
}) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const query = normalize(text.trim())
  const matches = (query ? catalog.filter((a) => normalize(a.name).includes(query)) : catalog).slice(0, MAX_SUGGESTIONS)

  function choose(article: Article) {
    onSelect(article)
    setText(article.name)
    setOpen(false)
  }

  function create() {
    onCreate?.(text.trim())
    setText('')
    setOpen(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && matches[active]) {
      // Entrée choisit la suggestion au lieu d'envoyer le formulaire.
      e.preventDefault()
      choose(matches[active])
    } else if (e.key === 'Enter' && open && onCreate && query && matches.length === 0) {
      e.preventDefault()
      create()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <input
        value={selected && !open ? selected.name : text}
        onChange={(e) => {
          setText(e.target.value)
          setActive(0)
          setOpen(true)
          if (selected) onSelect(null)
        }}
        onFocus={() => setOpen(true)}
        // Laisse le temps au clic sur une suggestion d'être pris en compte.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder="Rechercher un article…"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={input}
      />
      {open && (matches.length > 0 || (onCreate && query)) && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-brand border border-zinc-200 bg-white py-1 shadow-lg">
          {matches.map((a, i) => (
            <li
              key={a.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(a)
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? 'bg-muted' : ''}`}
            >
              <div className="flex justify-between gap-3">
                <span className="font-semibold">{a.name}</span>
                <span className="whitespace-nowrap text-zinc-600">{euro.format(a.unitPriceHt)} HT</span>
              </div>
              {a.description && <p className="line-clamp-2 whitespace-pre-line text-xs text-zinc-500">{a.description}</p>}
            </li>
          ))}
          {onCreate && query && (
            <li
              role="option"
              aria-selected={matches.length === 0}
              onMouseDown={(e) => {
                e.preventDefault()
                create()
              }}
              className={`cursor-pointer border-t border-zinc-100 px-3 py-2 font-semibold text-primary hover:bg-muted ${matches.length === 0 ? 'bg-muted' : ''}`}
            >
              + Nouvel article « {text.trim()} »
            </li>
          )}
        </ul>
      )}
      {open && query && matches.length === 0 && !onCreate && (
        <p className="absolute z-20 mt-1 w-full rounded-brand border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-lg">
          Aucun article ne correspond.
        </p>
      )}
    </div>
  )
}
