import { ApiError, AppointmentApiRepository } from '@atelio/core/data'
import { CheckAppointmentStart, StartAppointment, ValidationError, type Appointment, type StartCheck } from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useBrand } from '../../brand/useBrand'

const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** "14:20" : maintenant, arrondi aux 5 minutes inférieures. */
function nowRounded(): string {
  const now = new Date()
  const minutes = now.getMinutes() - (now.getMinutes() % 5)
  return `${String(now.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** "2026-10-12" (jour local) + "14:20" => "2026-10-12T14:20". */
function localDateTime(time: string): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${time}`
}

type CheckState = { status: 'checking' } | { status: 'done'; check: StartCheck } | { status: 'error'; message: string }

function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message
  if (error instanceof ApiError && error.status < 500) return error.message
  return "L'action a échoué. Vérifiez que l'API est démarrée puis réessayez."
}

/**
 * Lancement d'un rendez-vous le jour même : heure réelle de début (maintenant par défaut), vérification
 * (premier mécanicien libre, fin estimée). Si personne n'est libre, on peut lancer quand même.
 */
export default function StartAppointmentForm({ appointment, onCancel }: { appointment: Appointment; onCancel: () => void }) {
  const { api } = useBrand()
  const navigate = useNavigate()
  const [startTime, setStartTime] = useState(nowRounded)
  const [result, setResult] = useState<{ time: string; state: CheckState } | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!/^\d{2}:\d{2}$/.test(startTime)) return
    let current = true
    new CheckAppointmentStart(new AppointmentApiRepository(api))
      .execute(appointment.reference, localDateTime(startTime))
      .then((check): CheckState => ({ status: 'done', check }))
      .catch((err): CheckState => ({ status: 'error', message: errorMessage(err) }))
      .then((state) => {
        if (current) setResult({ time: startTime, state })
      })
    return () => {
      current = false
    }
  }, [api, appointment.reference, startTime])

  const state: CheckState = result?.time === startTime ? result.state : { status: 'checking' }

  async function start() {
    setError('')
    setStarting(true)
    try {
      const interventionId = await new StartAppointment(new AppointmentApiRepository(api)).execute(
        appointment.reference,
        localDateTime(startTime),
      )
      navigate(`/interventions/${interventionId}`)
    } catch (err) {
      setError(errorMessage(err))
      setStarting(false)
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold">Lancer l'intervention</h3>
      <p className="text-sm text-zinc-600">
        Rendez-vous prévu : {time.format(new Date(appointment.scheduledAt))} – {time.format(new Date(appointment.estimatedEndAt))}
      </p>
      <label className="flex items-center gap-3 text-sm">
        <span className="text-zinc-600">Début réel</span>
        <input
          type="time"
          step={300}
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded-brand border border-zinc-300 px-3 py-1.5 outline-none focus:border-primary"
        />
      </label>

      {state.status === 'checking' && <p className="text-sm text-zinc-500">Vérification…</p>}
      {state.status === 'error' && <p className="rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}
      {state.status === 'done' && state.check.possible && (
        <p className="text-sm font-medium text-emerald-700">
          ✓ Possible · fin estimée {time.format(new Date(state.check.estimatedEndAt))} (pauses comprises)
          {state.check.employeeName && <span className="font-normal text-zinc-600"> · mécanicien : {state.check.employeeName}</span>}
        </p>
      )}
      {state.status === 'done' && !state.check.possible && (
        <p className="rounded-brand bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠ {state.check.message} Vous pouvez lancer quand même : le mécanicien sera à choisir dans l'intervention.
        </p>
      )}

      {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-primary">
          Annuler
        </button>
        <button
          type="button"
          disabled={starting || state.status !== 'done'}
          onClick={start}
          className="rounded-brand bg-secondary px-5 py-2 text-sm font-semibold text-on-secondary disabled:opacity-40"
        >
          {starting ? 'Lancement…' : state.status === 'done' && !state.check.possible ? 'Lancer quand même' : "Lancer l'intervention"}
        </button>
      </div>
    </div>
  )
}
