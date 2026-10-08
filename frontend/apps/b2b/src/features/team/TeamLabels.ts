import type { AbsenceReason, EmployeeRole } from '@atelio/core/domain'

export const roleLabels: Record<EmployeeRole, string> = {
  mechanic: 'Mécanicien',
  manager: 'Gérant',
  reception: 'Accueil',
}

export const reasonLabels: Record<AbsenceReason, string> = {
  leave: 'Congé',
  sick: 'Maladie',
  training: 'Formation',
  other: 'Autre',
}

export const dayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/** "2026-10-12" de la date locale. */
export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Lundi de la semaine de cette date. */
export function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

/** "2026-10-12" => "12 oct." */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return shortDate.format(new Date(y, m - 1, d))
}
