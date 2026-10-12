// Statuts : chacun a sa table en base (id, label, is_active). Les ids sont fixes et partagés
// avec le backend (enums C#) : le code s'appuie sur l'id, l'affichage sur le libellé de la table.

/** Statut d'un enregistrement : id fixe et libellé lu dans la table de statuts. */
export type Status<TId extends number = number> = {
  id: TId;
  label: string;
};

/** Ligne d'une table de statuts (ex. options d'un filtre). Inactif : ne s'attribue plus. */
export type StatusOption<TId extends number = number> = Status<TId> & {
  isActive: boolean;
};

/** Table appointment_status. */
export const AppointmentStatus = {
  Pending: 1,
  Confirmed: 2,
  Cancelled: 3,
  Completed: 4,
  NoShow: 5,
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

/** Table intervention_status : en cours → terminée → facturée → clôturée (payée). */
export const InterventionStatus = {
  Planned: 1,
  InProgress: 2,
  Done: 3,
  Invoiced: 4,
  Closed: 5,
  Cancelled: 6,
} as const;
export type InterventionStatus = (typeof InterventionStatus)[keyof typeof InterventionStatus];

/** Table invoice_status. */
export const InvoiceStatus = {
  Draft: 1,
  Issued: 2,
  Paid: 3,
  PartiallyPaid: 4,
  Cancelled: 5,
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

/** Table payment_status. */
export const PaymentStatus = {
  Pending: 1,
  Succeeded: 2,
  Failed: 3,
  Refunded: 4,
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
