/** Roue et message pendant qu'une zone de la page attend les données de l'API. */
export default function LoadingState({ message, className = 'py-16' }: { message: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-4 text-zinc-500 ${className}`}>
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-zinc-200 border-t-primary" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
