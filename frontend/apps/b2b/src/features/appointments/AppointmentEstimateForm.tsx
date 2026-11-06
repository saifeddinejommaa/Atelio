import { ApiError, AppointmentApiRepository } from '@atelio/core/data'
import { SetAppointmentEstimate, type Appointment } from '@atelio/core/domain'
import { useState } from 'react'
import { useBrand } from '../../brand/useBrand'
import { hoursToMinutes, isValidEstimate, minutesToHours } from './EstimateHours'

/** Estimation d'un rendez-vous, indiquée ou retirée : elle fait entrer le rendez-vous dans le planning, ou l'en sort. */
export default function AppointmentEstimateForm({
  appointment,
  onChanged,
}: {
  appointment: Appointment
  onChanged: (message: string) => void
}) {
  const { api } = useBrand()
  const initial = appointment.estimatedMinutes === null ? '' : minutesToHours(appointment.estimatedMinutes)
  const [hours, setHours] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const empty = hours.trim() === ''
  const canSave = hours !== initial && (empty || isValidEstimate(hours))

  async function save() {
    setBusy(true)
    setError('')
    try {
      const warning = await new SetAppointmentEstimate(new AppointmentApiRepository(api)).execute(appointment.reference, empty ? null : hoursToMinutes(hours))
      onChanged(warning ?? (empty ? 'Estimation retirée.' : 'Estimation enregistrée.'))
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : "L'enregistrement a échoué, réessayez.")
      setBusy(false)
    }
  }

  return (
    <div className="mt-3">
      <label htmlFor="appointment-estimate" className="block text-sm font-semibold">
        Votre estimation (en heures)
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="appointment-estimate"
          inputMode="decimal"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Indiquez le temps estimé"
          className="min-w-0 flex-1 rounded-brand border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={busy || !canSave}
          onClick={() => void save()}
          className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
        >
          Enregistrer
        </button>
      </div>
      {error && <p className="mt-2 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
