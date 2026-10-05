import type { PaymentMethod } from "./intervention";
import type { InvoiceStatus, Status } from "./status";

/** Ligne figée de la facture (prix TTC). */
export type InvoiceLine = {
  /** Main-d'œuvre ou pièce. */
  kind: "labour" | "part";
  label: string;
  reference: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

/** Facture émise, avec ses lignes et son règlement. */
export type Invoice = {
  id: number;
  number: string;
  /** ISO 8601 en UTC. */
  issuedAt: string;
  dueDate: string | null;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  status: Status<InvoiceStatus>;
  interventionId: number;
  appointmentReference: string | null;
  garageName: string;
  garageAddress: string;
  garagePhone: string | null;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  vehiclePlate: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  mileage: number | null;
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  lines: InvoiceLine[];
};
