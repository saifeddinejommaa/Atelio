import { useEffect } from 'react'

/**
 * Message d'erreur technique (API arrêtée, réponse 5xx...) : icône et message simple, sans détail technique.
 * Le détail reste visible dans la console du navigateur. Affiché à la place du contenu en erreur seulement :
 * le reste de l'écran (menu, en-tête...) reste disponible.
 */
export default function TechnicalError({ error }: { error: unknown }) {
  useEffect(() => console.error(error), [error])

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <TechnicalIssueIcon />
      <h1 className="text-xl font-bold text-zinc-800">Un problème technique est survenu</h1>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-brand border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-400"
      >
        Réessayer
      </button>
    </div>
  )
}

/** Triangle avec un point d'exclamation (couleurs neutres : le thème de la marque peut manquer). */
export function TechnicalIssueIcon() {
  return (
    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    </span>
  )
}
