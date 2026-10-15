import { isRouteErrorResponse, useRouteError } from 'react-router'
import TechnicalError, { TechnicalIssueIcon } from './TechnicalError'

/**
 * Erreur d'une page : message d'erreur technique à la place de la page (le menu reste affiché).
 * Page inexistante : « Page introuvable ».
 */
export default function ErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <TechnicalIssueIcon />
        <h1 className="text-xl font-bold text-zinc-800">Page introuvable</h1>
      </div>
    )
  }

  return <TechnicalError error={error} />
}
