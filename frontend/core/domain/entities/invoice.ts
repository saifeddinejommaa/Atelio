import type { PaymentMethod } from "./intervention";
import type { Page } from "./page";
import type { InvoiceStatus, Status } from "./status";

/** Ligne figée de la facture : prix HT pour un article, TTC pour la main-d'œuvre et les pièces (anciennes factures). */
export type InvoiceLine = {
  /** Article, ou main-d'œuvre / pièce. */
  kind: "article" | "labour" | "part";
  label: string;
  reference: string | null;
  /** Opérations de l'article. */
  description: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

/** Règlement d'une facture (total ou partiel). */
export type InvoicePayment = {
  /** ISO 8601 en UTC. */
  paidAt: string;
  method: PaymentMethod;
  amount: number;
};

/** Version PDF stockée d'une facture. */
export type InvoiceDocument = {
  version: number;
  /** ISO 8601 en UTC. */
  createdAt: string;
};

/** Facture dans la liste du back-office. */
export type InvoiceSummary = {
  id: number;
  number: string;
  /** ISO 8601 en UTC. */
  issuedAt: string;
  totalHt: number;
  totalTtc: number;
  status: Status<InvoiceStatus>;
  interventionId: number;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  vehiclePlate: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
};

export type InvoiceFilter = {
  garageId?: number;
  /** Période d'émission, jours locaux inclus : "2026-10-01". */
  from?: string;
  to?: string;
  /** Nom et/ou prénom du client. */
  customer?: string;
  /** Immatriculation (partielle). */
  plate?: string;
  page?: number;
  pageSize?: number;
};

/** Page de factures, avec les totaux de toute la sélection (pas seulement la page). */
export type InvoicePage = Page<InvoiceSummary> & { sumHt: number; sumTtc: number };

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
  /** Règlements reçus, du plus ancien au plus récent. */
  payments: InvoicePayment[];
  amountPaid: number;
  remaining: number;
  /** Versions PDF stockées, de la plus récente à la plus ancienne (vide : facture émise avant les PDF). */
  documents: InvoiceDocument[];
  lines: InvoiceLine[];
};
