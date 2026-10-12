import { useState } from 'react'
import SidePanel from '../../components/SidePanel'
import AbsencesCard from './AbsencesCard'
import ScheduleCard from './ScheduleCard'
import { addDays, isoDate, roleLabels } from './TeamLabels'
import { useTeam } from './useTeam'

type Tab = 'schedule' | 'absences'

/** Modification d'un employé : planning type (une pause par jour) ou absences à la journée. */
export default function EditEmployeePanel({
  garageId,
  employeeId,
  onClose,
  onChanged,
}: {
  garageId: number
  employeeId: number
  onClose: () => void
  /** Planning ou absences modifiés : la page recharge l'équipe. */
  onChanged: () => void
}) {
  // Absences en cours et à venir (un an).
  const [[from, to]] = useState(() => [isoDate(new Date()), isoDate(addDays(new Date(), 366))])
  const { state, reload } = useTeam(garageId, from, to)
  const [tab, setTab] = useState<Tab>('schedule')

  const member = state.status === 'ok' ? state.members.find((m) => m.id === employeeId) : undefined

  function changed() {
    reload()
    onChanged()
  }

  return (
    <SidePanel
      title={member ? `${member.firstName} ${member.lastName}` : 'Employé'}
      wide
      subtitle={member && roleLabels[member.role]}
      onClose={onClose}
    >
      {state.status === 'loading' && <p className="text-sm text-zinc-500">Chargement…</p>}
      {state.status === 'error' && <p className="text-sm text-red-700">L'employé n'a pas pu être chargé.</p>}
      {state.status === 'ok' && !member && <p className="text-sm text-zinc-600">Cet employé n'est plus dans l'équipe.</p>}

      {member && (
        <>
          <div className="flex rounded-brand bg-muted p-1 text-sm font-semibold">
            {(['schedule', 'absences'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`flex-1 rounded-brand px-3 py-2 ${tab === t ? 'bg-white shadow-sm' : 'text-zinc-500'}`}
              >
                {t === 'schedule' ? 'Planning' : `Absences${member.absences.length ? ` (${member.absences.length})` : ''}`}
              </button>
            ))}
          </div>

          {/* Clé : le formulaire repart du planning enregistré après chaque sauvegarde. */}
          {tab === 'schedule' && <ScheduleCard key={JSON.stringify(member.schedule)} member={member} onSaved={changed} />}
          {tab === 'absences' && <AbsencesCard member={member} onChanged={changed} />}
        </>
      )}
    </SidePanel>
  )
}
