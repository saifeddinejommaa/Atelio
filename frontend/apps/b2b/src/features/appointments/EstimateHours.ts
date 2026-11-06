/** Temps estimé maximal : 200 h de travail (règle de l'API : BookingRules.MaxEstimatedMinutes). */
const MAX_ESTIMATED_MINUTES = 200 * 60

/** "1,75" ou "1.75" => 105 ; vide ou invalide => NaN. */
export function hoursToMinutes(hours: string): number {
  return hours.trim() === '' ? NaN : Math.round(Number(hours.replace(',', '.')) * 60)
}

/** 105 => "1,75" (heures, avec virgule). */
export function minutesToHours(minutes: number): string {
  return String(Math.round((minutes / 60) * 100) / 100).replace('.', ',')
}

export function isValidEstimate(hours: string): boolean {
  const minutes = hoursToMinutes(hours)
  return Number.isInteger(minutes) && minutes > 0 && minutes <= MAX_ESTIMATED_MINUTES
}
