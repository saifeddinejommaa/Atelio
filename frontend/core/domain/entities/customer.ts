import type { InvoiceStatus, Status } from "./status";

export type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

/** Client dans la liste du back-office. */
export type CustomerSummary = Customer & {
  /** Immatriculations de ses véhicules actifs, "AB-123-CD, EF-456-GH". */
  plates: string | null;
  /** Dernière intervention commencée, ISO 8601 en UTC. */
  lastVisitAt: string | null;
  invoiceCount: number;
};

export type CustomerFilter = {
  /** Nom, e-mail, téléphone ou immatriculation. */
  search?: string;
  page?: number;
  pageSize?: number;
};

/** Facture d'un client (fiche client du back-office). */
export type CustomerInvoice = {
  id: number;
  number: string;
  /** ISO 8601 en UTC. */
  issuedAt: string;
  totalHt: number;
  totalTtc: number;
  status: Status<InvoiceStatus>;
  interventionId: number;
  vehiclePlate: string;
  garageName: string;
};

/** Fiche d'un nouveau client, par exemple saisie par le garage (e-mail facultatif). */
export type NewCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
};
