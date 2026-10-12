/** Client tel que renvoyé par GET /api/customers/... */
export type CustomerDto = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

/** Élément de GET /api/customers. */
export type CustomerSummaryDto = CustomerDto & {
  plates: string | null;
  lastVisitAt: string | null;
  invoiceCount: number;
};

/** Élément de GET /api/customers/{id}/invoices. */
export type CustomerInvoiceDto = {
  id: number;
  number: string;
  issuedAt: string;
  totalHt: number;
  totalTtc: number;
  statusId: number;
  statusLabel: string;
  interventionId: number;
  vehiclePlate: string;
  garageName: string;
};
