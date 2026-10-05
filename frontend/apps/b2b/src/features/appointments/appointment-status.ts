import type { AppointmentDisplayStatus } from '@atelio/core/domain'

/** Libellé et couleur de chaque statut affiché dans le calendrier (voir appointmentDisplayStatus). */
export const appointmentStatuses: Record<AppointmentDisplayStatus, { label: string; color: string; contrastColor: string }> = {
  pending: { label: 'En attente', color: '#f59e0b', contrastColor: '#1f2937' },
  confirmed: { label: 'Confirmé', color: '#2563eb', contrastColor: '#ffffff' },
  in_intervention: { label: 'En intervention', color: '#16a34a', contrastColor: '#ffffff' },
  closed: { label: 'Clôturé', color: '#71717a', contrastColor: '#ffffff' },
  no_show: { label: 'Non venu', color: '#dc2626', contrastColor: '#ffffff' },
  cancelled: { label: 'Annulé', color: '#d4d4d8', contrastColor: '#52525b' },
}
