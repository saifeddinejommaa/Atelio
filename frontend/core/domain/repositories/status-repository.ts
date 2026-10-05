import type { AppointmentStatus, InterventionStatus, InvoiceStatus, PaymentStatus, StatusOption } from "../entities/status";

/** Tables de statuts (actifs et inactifs), triées par id. */
export interface StatusRepository {
  getAppointmentStatuses(): Promise<StatusOption<AppointmentStatus>[]>;
  getInterventionStatuses(): Promise<StatusOption<InterventionStatus>[]>;
  getInvoiceStatuses(): Promise<StatusOption<InvoiceStatus>[]>;
  getPaymentStatuses(): Promise<StatusOption<PaymentStatus>[]>;
}
