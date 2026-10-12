import { GarageApiRepository } from '@atelio/core/data'
import { CheckSlot, type SlotCheckQuery } from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { useBrand } from '../../brand/useBrand'

export type SlotCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  /** estimatedEndAt : fin estimée, pauses comprises. warning : conseil non bloquant. */
  | { status: 'available'; estimatedEndAt: string | null; warning: string | null }
  | { status: 'unavailable'; message: string }

/** Vérifie la disponibilité du créneau à chaque changement de la demande (null : rien à vérifier). */
export function useSlotCheck(query: SlotCheckQuery | null): SlotCheckState {
  const { api } = useBrand()
  const [result, setResult] = useState<{ key: string; state: SlotCheckState } | null>(null)
  const key = query ? JSON.stringify(query) : ''

  useEffect(() => {
    if (!key) return
    let current = true
    new CheckSlot(new GarageApiRepository(api))
      .execute(JSON.parse(key) as SlotCheckQuery)
      .then(
        (check): SlotCheckState =>
          check.available
            ? { status: 'available', estimatedEndAt: check.estimatedEndAt, warning: check.warning }
            : { status: 'unavailable', message: check.message ?? '' },
      )
      .catch((): SlotCheckState => ({ status: 'unavailable', message: 'Impossible de vérifier la disponibilité.' }))
      .then((state) => {
        // Une réponse arrivée après une nouvelle demande est ignorée.
        if (current) setResult({ key, state })
      })
    return () => {
      current = false
    }
  }, [api, key])

  if (!key) return { status: 'idle' }
  return result?.key === key ? result.state : { status: 'checking' }
}
