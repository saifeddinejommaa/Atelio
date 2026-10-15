/** Problème technique (API arrêtée, erreur serveur...) : icône et message simple, sans détail technique. */
export default function TechnicalError({ onRetry }: { onRetry?: () => void }) {
  return (
    <section role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10"
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </span>
      <h1 className="text-xl font-bold text-zinc-800">Un problème technique est survenu</h1>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-400"
        >
          Réessayer
        </button>
      )}
    </section>
  );
}
