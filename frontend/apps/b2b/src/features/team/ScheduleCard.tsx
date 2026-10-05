import { ApiError, TeamApiRepository } from '@atelio/core/data'
import { dayMinutes, SaveEmployeeSchedule, ValidationError, type DaySchedule, type TeamMember } from '@atelio/core/domain'
import { useState } from 'react'
import { useBrand } from '../../brand/use-brand'
import { dayLabels } from './team-labels'

type Row = { works: boolean; start: string; breakStart: string; breakEnd: string; end: string }

const DEFAULT_ROW: Row = { works: false, start: '08:30', breakStart: '12:00', breakEnd: '13:30', end: '18:30' }

function toRows(schedule: DaySchedule[]): Row[] {
  return dayLabels.map((_, i) => {
    const day = schedule.find((d) => d.dayOfWeek === i + 1)
    return day
      ? { works: true, start: day.start, breakStart: day.breakStart ?? '', breakEnd: day.breakEnd ?? '', end: day.end }
      : { ...DEFAULT_ROW }
  })
}

function toDays(rows: Row[]): DaySchedule[] {
  return rows.flatMap((r, i) =>
    r.works
      ? [{ dayOfWeek: i + 1, start: r.start, end: r.end, breakStart: r.breakStart || null, breakEnd: r.breakEnd || null }]
      : [],
  )
}

/** Planning type : par jour, arrivée, pause (début et fin) et départ. */
export default function ScheduleCard({ member, onSaved }: { member: TeamMember; onSaved: () => void }) {
  const { api } = useBrand()
  const [rows, setRows] = useState(() => toRows(member.schedule))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const days = toDays(rows)
  const totalHours = days.reduce((sum, d) => sum + Math.max(dayMinutes(d), 0), 0) / 60

  function update(index: number, changes: Partial<Row>) {
    setMessage(null)
    setRows((cur) => cur.map((r, i) => (i === index ? { ...r, ...changes } : r)))
  }

  /** Copie les horaires du lundi sur tous les jours travaillés. */
  function copyMonday() {
    setMessage(null)
    setRows((cur) => cur.map((r, i) => (i > 0 && r.works ? { ...cur[0], works: true } : r)))
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      await new SaveEmployeeSchedule(new TeamApiRepository(api)).execute(member.id, days)
      setMessage({ ok: true, text: 'Planning enregistré.' })
      onSaved()
    } catch (err) {
      const text =
        err instanceof ValidationError || (err instanceof ApiError && err.status < 500)
          ? err.message
          : "L'enregistrement a échoué, réessayez."
      setMessage({ ok: false, text })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Planning type</h2>
        <span className="text-sm text-zinc-600">
          Total : {totalHours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h / semaine
        </span>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="py-2">Jour</th>
            <th className="py-2">Arrivée</th>
            <th className="py-2">Pause de</th>
            <th className="py-2">à</th>
            <th className="py-2">Départ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={dayLabels[i]} className={r.works ? '' : 'text-zinc-400'}>
              <td className="py-1.5 pr-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={r.works} onChange={(e) => update(i, { works: e.target.checked })} className="accent-secondary" />
                  {dayLabels[i]}
                </label>
              </td>
              {r.works ? (
                <>
                  <TimeCell value={r.start} label={`Arrivée ${dayLabels[i]}`} onChange={(v) => update(i, { start: v })} />
                  <TimeCell value={r.breakStart} label={`Début de pause ${dayLabels[i]}`} onChange={(v) => update(i, { breakStart: v })} />
                  <TimeCell value={r.breakEnd} label={`Fin de pause ${dayLabels[i]}`} onChange={(v) => update(i, { breakEnd: v })} />
                  <TimeCell value={r.end} label={`Départ ${dayLabels[i]}`} onChange={(v) => update(i, { end: v })} />
                </>
              ) : (
                <td colSpan={4} className="py-1.5">
                  Repos
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-zinc-500">Laissez la pause vide pour une journée sans pause.</p>

      {message && (
        <p className={`mt-4 rounded-brand px-3 py-2 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <button
          type="button"
          onClick={copyMonday}
          disabled={!rows[0].works}
          className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold hover:border-primary disabled:opacity-40"
        >
          Copier le lundi sur les jours travaillés
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-brand bg-secondary px-5 py-2 text-sm font-semibold text-on-secondary disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer le planning'}
        </button>
      </div>
    </section>
  )
}

function TimeCell({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
  return (
    <td className="py-1.5 pr-2">
      <input
        type="time"
        step={900}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 rounded-brand border border-zinc-300 px-2 py-1 outline-none focus:border-primary"
      />
    </td>
  )
}
