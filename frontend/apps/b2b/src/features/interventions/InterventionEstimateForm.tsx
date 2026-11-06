import { ApiError, InterventionApiRepository } from '@atelio/core/data'
import { SetInterventionEstimate, ValidationError } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import { hoursToMinutes, isValidEstimate } from '../appointments/EstimateHours'

/** Estimation des prestations sans temps connu : elle fait entrer l'intervention dans le planning. */
export default function InterventionEstimateForm({ interventionId }: { interventionId: number }) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const [hours, setHours] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await new SetInterventionEstimate(new InterventionApiRepository(api)).execute(interventionId, hoursToMinutes(hours))
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void save(e)} className="mt-3 text-sm">
      <label htmlFor="intervention-estimate" className="block font-semibold">
        Votre estimation (en heures)
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="intervention-estimate"
          inputMode="decimal"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Indiquez le temps estimé"
          className="min-w-0 flex-1 rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary"
        />
        <button type="submit" disabled={busy || !isValidEstimate(hours)} className="rounded-brand bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-40">
          Enregistrer
        </button>
      </div>
      {error && <p className="mt-2 rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}
    </form>
  )
}
