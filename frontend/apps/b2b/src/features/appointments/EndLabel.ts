const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayAndTime = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Fin estimée : l'heure seule si elle tombe le jour du début, sinon avec le jour (travail sur plusieurs jours). */
export function endLabel(start: Date, end: Date): string {
  return start.toDateString() === end.toDateString() ? time.format(end) : dayAndTime.format(end)
}

/** Fin estimée, toujours avec le jour. */
export function endWithDay(end: Date): string {
  return dayAndTime.format(end)
}
