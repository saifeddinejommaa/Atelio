import { TeamApiRepository } from '@atelio/core/data'
import { GetTeam, type TeamMember } from '@atelio/core/domain'
import { useCallback, useEffect, useState } from 'react'
import { useBrand } from '../../brand/useBrand'

export type TeamState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; members: TeamMember[] }

/** Équipe du garage avec les absences sur [from, to]. reload : à appeler après une modification. */
export function useTeam(garageId: number, from: string, to: string): { state: TeamState; reload: () => void } {
  const { api } = useBrand()
  const [result, setResult] = useState<{ key: string; state: TeamState } | null>(null)
  const [version, setVersion] = useState(0)
  const key = `${garageId}|${from}|${to}|${version}`

  useEffect(() => {
    let current = true
    new GetTeam(new TeamApiRepository(api))
      .execute(garageId, from, to)
      .then((members): TeamState => ({ status: 'ok', members }))
      .catch((): TeamState => ({ status: 'error' }))
      .then((state) => {
        if (current) setResult({ key, state })
      })
    return () => {
      current = false
    }
  }, [api, garageId, from, to, key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { state: result?.key === key ? result.state : (result?.state ?? { status: 'loading' }), reload }
}
