import { InterventionStatus, type PaymentMethod } from '@atelio/core/domain'

/** Style du badge de chaque statut d'intervention (le libellé vient de la table intervention_status). */
export const interventionStatusClasses: Record<InterventionStatus, string> = {
  [InterventionStatus.Planned]: 'bg-zinc-100 text-zinc-600',
  [InterventionStatus.InProgress]: 'bg-emerald-100 text-emerald-800',
  [InterventionStatus.Done]: 'bg-amber-100 text-amber-800',
  [InterventionStatus.Invoiced]: 'bg-blue-100 text-blue-800',
  [InterventionStatus.Closed]: 'bg-zinc-200 text-zinc-700',
  [InterventionStatus.Cancelled]: 'bg-zinc-100 text-zinc-500',
}

export const paymentMethods: Record<PaymentMethod, string> = {
  card: 'Carte bancaire',
  cash: 'Espèces',
  check: 'Chèque',
  transfer: 'Virement',
}
