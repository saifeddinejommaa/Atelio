import type { InterventionStage, PaymentMethod } from '@atelio/core/domain'

/** Libellé et style de chaque étape d'intervention. */
export const interventionStages: Record<InterventionStage, { label: string; className: string }> = {
  in_progress: { label: 'En cours', className: 'bg-emerald-100 text-emerald-800' },
  ready: { label: 'Prête', className: 'bg-amber-100 text-amber-800' },
  invoiced: { label: 'Facturée', className: 'bg-blue-100 text-blue-800' },
  closed: { label: 'Clôturée', className: 'bg-zinc-200 text-zinc-700' },
  cancelled: { label: 'Annulée', className: 'bg-zinc-100 text-zinc-500' },
}

export const paymentMethods: Record<PaymentMethod, string> = {
  card: 'Carte bancaire',
  cash: 'Espèces',
  check: 'Chèque',
  transfer: 'Virement',
}
