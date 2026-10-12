import { ApiError, TeamApiRepository } from '@atelio/core/data'
import { DeclareAbsence, DeleteAbsence, ValidationError, type AbsenceReason, type TeamMember } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import { formatDay, isoDate, reasonLabels } from './TeamLabels'

function errorText(err: unknown): string {
  return err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'action a échoué, réessayez."
}

/** Absences à la journée (un ou plusieurs jours) : liste des absences en cours et à venir, déclaration, suppression. */
export default function AbsencesCard({ member, onChanged }: { member: TeamMember; onChanged: () => void }) {
  const { api } = useBrand()
  const repository = new TeamApiRepository(api)
  const [today] = useState(() => isoDate(new Date()))

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState<AbsenceReason>('leave')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function declare(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await new DeclareAbsence(repository).execute(member.id, { startDate, endDate, reason, comment })
      setComment('')
      onChanged()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  async function remove(absenceId: number) {
    setBusy(true)
    setError('')
    try {
      await new DeleteAbsence(repository).execute(member.id, absenceId)
      onChanged()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Absences</h2>

      {member.absences.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Aucune absence en cours ou à venir.</p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100">
          {member.absences.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <span>
                <span className="font-semibold">{reasonLabels[a.reason]}</span>{' '}
                {a.startDate === a.endDate ? `le ${formatDay(a.startDate)}` : `du ${formatDay(a.startDate)} au ${formatDay(a.endDate)}`}
                {a.comment && <span className="block text-zinc-500">{a.comment}</span>}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(a.id)}
                className="shrink-0 text-xs font-semibold text-red-700 hover:underline disabled:opacity-40"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={declare} className="mt-5 space-y-3 border-t border-zinc-100 pt-4">
        <h3 className="text-sm font-semibold">Déclarer une absence</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-zinc-600">Du</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (endDate < e.target.value) setEndDate(e.target.value)
              }}
              className="mt-1 w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600">Au (inclus)</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-zinc-600">Motif</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as AbsenceReason)}
            className="mt-1 w-full rounded-brand border border-zinc-300 bg-white px-3 py-2"
          >
            {Object.entries(reasonLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600">Commentaire (facultatif)</span>
          <input
            value={comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="rounded-brand bg-secondary px-5 py-2 text-sm font-semibold text-on-secondary disabled:opacity-40">
            Déclarer l'absence
          </button>
        </div>
      </form>
    </section>
  )
}
