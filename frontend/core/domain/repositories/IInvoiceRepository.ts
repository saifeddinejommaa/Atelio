import type { PaymentMethod } from "../entities/intervention";
import type { Invoice, InvoiceFilter, InvoicePage } from "../entities/invoice";

export interface IInvoiceRepository {
  /** Factures filtrées, des plus récentes aux plus anciennes, avec les totaux de la sélection. */
  getInvoices(filter: InvoiceFilter): Promise<InvoicePage>;
  getById(id: number): Promise<Invoice | null>;
  /** Travaux terminés : l'intervention est prête. */
  finishIntervention(interventionId: number): Promise<void>;
  /** Émet la facture de l'intervention prête avec le montant reçu (0 : rien) et renvoie son identifiant. */
  issue(interventionId: number, amountPaid: number, method: PaymentMethod | null): Promise<number>;
  /** Encaisse un règlement (total ou partiel) : une nouvelle version du PDF est générée. */
  pay(invoiceId: number, method: PaymentMethod, amount: number): Promise<void>;
  /** PDF stocké : dernière version, ou celle demandée. Null s'il n'existe pas. */
  getPdf(invoiceId: number, version?: number): Promise<Blob | null>;
  /** Génère une nouvelle version du PDF (facture émise avant les PDF). */
  generatePdf(invoiceId: number): Promise<void>;
}
