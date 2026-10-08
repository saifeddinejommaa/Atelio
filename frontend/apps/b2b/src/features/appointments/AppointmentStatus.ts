import {
  AppointmentStatus,
  InterventionStatus,
  type AppointmentDisplayStatus,
  type StatusOption,
} from '@atelio/core/domain'

type StatusColors = { color: string; contrastColor: string }

const amber: StatusColors = { color: '#f59e0b', contrastColor: '#1f2937' }
const blue: StatusColors = { color: '#2563eb', contrastColor: '#ffffff' }
const green: StatusColors = { color: '#16a34a', contrastColor: '#ffffff' }
const grey: StatusColors = { color: '#71717a', contrastColor: '#ffffff' }
const red: StatusColors = { color: '#dc2626', contrastColor: '#ffffff' }
const light: StatusColors = { color: '#d4d4d8', contrastColor: '#52525b' }

/** Délai minimal avant un rendez-vous (règle de l'API : SlotPlanner.MinLeadMinutes). */
export const MIN_LEAD_HOURS = 3

/** Fond hachuré des créneaux qu'on ne peut plus réserver (passés ou à moins de MIN_LEAD_HOURS), défini dans index.css. */
export const LOCKED_BACKGROUND = 'var(--slot-locked)'

/** Couleurs du calendrier par statut de rendez-vous (avant le lancement de l'intervention). */
const appointmentColors: Record<AppointmentStatus, StatusColors> = {
  [AppointmentStatus.Pending]: amber,
  [AppointmentStatus.Confirmed]: blue,
  [AppointmentStatus.Cancelled]: light,
  [AppointmentStatus.Completed]: grey,
  [AppointmentStatus.NoShow]: red,
}

/** Puis par statut de son intervention : vert tant qu'elle n'est pas réglée, gris une fois clôturée. */
const interventionColors: Record<InterventionStatus, StatusColors> = {
  [InterventionStatus.Planned]: green,
  [InterventionStatus.InProgress]: green,
  [InterventionStatus.Done]: green,
  [InterventionStatus.Invoiced]: green,
  [InterventionStatus.Closed]: grey,
  [InterventionStatus.Cancelled]: light,
}

export function displayColors(display: AppointmentDisplayStatus): StatusColors {
  return display.kind === 'intervention' ? interventionColors[display.status.id] : appointmentColors[display.status.id]
}

/**
 * Légende du calendrier : statuts actifs regroupés par couleur (libellés des tables).
 * « Terminé » (rendez-vous lancé) et « Annulée » (intervention) ne sont pas listés : le calendrier
 * affiche alors le statut de l'intervention, ou le rendez-vous annulé.
 */
export function calendarLegend(
  appointmentStatuses: StatusOption<AppointmentStatus>[],
  interventionStatuses: StatusOption<InterventionStatus>[],
): { label: string; color: string }[] {
  const entries = [
    ...appointmentStatuses
      .filter((s) => s.isActive && s.id !== AppointmentStatus.Completed)
      .map((s) => ({ label: s.label, color: appointmentColors[s.id].color })),
    ...interventionStatuses
      .filter((s) => s.isActive && s.id !== InterventionStatus.Cancelled)
      .map((s) => ({ label: s.label, color: interventionColors[s.id].color })),
  ]

  const groups = new Map<string, string[]>()
  for (const e of entries) groups.set(e.color, [...(groups.get(e.color) ?? []), e.label])
  return [...groups].map(([color, labels]) => ({ color, label: labels.join(' / ') }))
}
