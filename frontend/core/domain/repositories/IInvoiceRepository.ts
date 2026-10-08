import type { PaymentMethod } from "../entities/intervention";
import type { Invoice } from "../entities/invoice";

export interface IInvoiceRepository {
  getById(id: number): Promise<Invoice | null>;
  /** Travaux terminés : l'intervention est prête. */
  finishIntervention(interventionId: number): Promise<void>;
  /** Émet la facture de l'intervention prête et renvoie son identifiant. */
  issue(interventionId: number): Promise<number>;
  /** Encaisse le montant total (un seul paiement). */
  pay(invoiceId: number, method: PaymentMethod): Promise<void>;
}
