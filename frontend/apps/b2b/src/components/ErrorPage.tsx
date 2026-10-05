import { ApiError } from '@atelio/core/data'
import { isRouteErrorResponse, useRouteError } from 'react-router'

/** Erreur dans une page de la marque (affichée dans le menu de la marque). */
export default function ErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? 'Page introuvable.'
      : error.statusText
    : error instanceof ApiError
      ? error.message
      : "L'API ne répond pas. Vérifiez qu'elle est démarrée."

  return (
    <div className="rounded-brand bg-white p-6 shadow-sm">
      <h1 className="text-lg font-bold">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-zinc-600">{message}</p>
    </div>
  )
}
