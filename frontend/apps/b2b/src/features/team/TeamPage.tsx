import { memberDay, weeklyHours, type TeamMember } from '@atelio/core/domain'
import { useState } from 'react'
import { useCurrentGarage } from '../../garage/use-current-garage'
import EditEmployeePanel from './EditEmployeePanel'
import { addDays, dayLabels, formatDay, isoDate, mondayOf, reasonLabels, roleLabels } from './team-labels'
import { useTeam } from './use-team'

/** Équipes : une carte dépliable par employé, avec sa semaine jour par jour. */
export default function TeamPage() {
  const garage = useCurrentGarage()
  const [monday, setMonday] = useState(() => mondayOf(new Date()))
  const [today] = useState(() => isoDate(new Date()))
  const days = Array.from({ length: 7 }, (_, i) => isoDate(addDays(monday, i)))
  const { state, reload } = useTeam(garage.id, days[0], days[6])
  const [open, setOpen] = useState<number[]>([])
  const [editing, setEditing] = useState<number | null>(null)

  function toggle(id: number) {
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Équipes</h1>
          <p className="mt-1 text-sm text-zinc-500">Dépliez un employé pour voir sa semaine.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-brand bg-primary text-on-primary">
            <button type="button" aria-label="Semaine précédente" onClick={() => setMonday(addDays(monday, -7))} className="px-3 py-2 hover:bg-white/10">
              ‹
            </button>
            <button type="button" aria-label="Semaine suivante" onClick={() => setMonday(addDays(monday, 7))} className="px-3 py-2 hover:bg-white/10">
              ›
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMonday(mondayOf(new Date()))}
            className="rounded-brand bg-primary px-3 py-2 text-sm font-semibold text-on-primary"
          >
            Cette semaine
          </button>
          <span className="ml-2 font-bold">
            {formatDay(days[0])} – {formatDay(days[6])}
          </span>
        </div>
      </div>

      {state.status === 'loading' && <p className="mt-6 text-sm text-zinc-500">Chargement…</p>}
      {state.status === 'error' && <p className="mt-6 text-sm text-red-700">L'équipe n'a pas pu être chargée.</p>}
      {state.status === 'ok' && state.members.length === 0 && (
        <p className="mt-6 rounded-brand bg-white p-6 text-sm text-zinc-600 shadow-sm">Aucun employé actif dans ce garage.</p>
      )}

      {state.status === 'ok' && (
        <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
          {state.members.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              days={days}
              today={today}
              expanded={open.includes(m.id)}
              onToggle={() => toggle(m.id)}
              onEdit={() => setEditing(m.id)}
            />
          ))}
        </div>
      )}

      {editing !== null && (
        <EditEmployeePanel
          garageId={garage.id}
          employeeId={editing}
          onClose={() => setEditing(null)}
          onChanged={reload}
        />
      )}
    </>
  )
}

function MemberCard({
  member,
  days,
  today,
  expanded,
  onToggle,
  onEdit,
}: {
  member: TeamMember
  days: string[]
  today: string
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const absentDays = days.filter((d) => memberDay(member, d).kind === 'absent').length

  return (
    <section className="overflow-hidden rounded-brand bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex flex-1 items-center gap-3 text-left">
          <span className={`text-zinc-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-on-secondary">
            {member.firstName.charAt(0)}
            {member.lastName.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">
              {member.firstName} {member.lastName}
            </span>
            <span className="block text-xs text-zinc-500">
              {roleLabels[member.role]} · {weeklyHours(member).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h / sem.
              {absentDays > 0 && (
                <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-800">
                  absent {absentDays} j cette semaine
                </span>
              )}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-brand border border-zinc-300 px-3 py-1.5 text-sm font-semibold hover:border-primary"
        >
          Modifier
        </button>
      </div>

      {expanded && (
        <table className="w-full border-t border-zinc-100 text-sm">
          <tbody className="divide-y divide-zinc-100">
            {days.map((d, i) => {
              const day = memberDay(member, d)
              return (
                <tr key={d} className={d === today ? 'bg-muted' : ''}>
                  <td className="w-40 px-4 py-2 font-medium">
                    {dayLabels[i]} <span className="font-normal text-zinc-500">{formatDay(d)}</span>
                  </td>
                  {day.kind === 'working' && (
                    <>
                      <td className="px-2 py-2">
                        {day.day.start} – {day.day.end}
                      </td>
                      <td className="px-4 py-2 text-zinc-500">
                        {day.day.breakStart ? `pause ${day.day.breakStart} – ${day.day.breakEnd}` : 'sans pause'}
                      </td>
                    </>
                  )}
                  {day.kind === 'absent' && (
                    <td colSpan={2} className="px-2 py-2">
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800">
                        {reasonLabels[day.absence.reason]}
                      </span>
                      {day.absence.comment && <span className="ml-2 text-zinc-500">{day.absence.comment}</span>}
                    </td>
                  )}
                  {day.kind === 'off' && (
                    <td colSpan={2} className="px-2 py-2 text-zinc-400">
                      Repos
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
