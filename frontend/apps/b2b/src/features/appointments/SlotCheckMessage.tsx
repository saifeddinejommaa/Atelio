import type { SlotCheckState } from './use-slot-check'

const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Résultat de la vérification du créneau, sous le champ concerné. */
export default function SlotCheckMessage({ check }: { check: SlotCheckState }) {
  if (check.status === 'idle') return null
  if (check.status === 'checking') return <p className="mt-2 text-sm text-zinc-500">Vérification de la disponibilité…</p>
  if (check.status === 'unavailable') {
    return <p className="mt-2 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{check.message}</p>
  }
  return (
    <>
      <p className="mt-2 text-sm font-medium text-emerald-700">
        ✓ Créneau disponible
        {check.estimatedEndAt && (
          <span className="font-normal text-zinc-600"> · fin estimée {time.format(new Date(check.estimatedEndAt))} (pauses comprises)</span>
        )}
      </p>
      {check.warning && <p className="mt-2 rounded-brand bg-amber-50 px-3 py-2 text-sm text-amber-800">{check.warning}</p>}
    </>
  )
}
