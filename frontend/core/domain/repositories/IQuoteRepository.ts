import type { NewGarageQuote, GarageQuote, GarageQuoteChanges, GarageQuoteSummary } from "../entities/GarageQuote";

export interface IQuoteRepository {
  getById(id: number): Promise<GarageQuote | null>;
  /** Devis du client, des plus récents aux plus anciens. */
  getByCustomer(customerId: number): Promise<GarageQuoteSummary[]>;
  /** Crée le devis et renvoie son identifiant. */
  create(quote: NewGarageQuote): Promise<number>;
  /** Modifie un devis ni envoyé ni importé. */
  update(id: number, changes: GarageQuoteChanges): Promise<void>;
  /** Envoie le devis par e-mail au client. */
  send(id: number): Promise<void>;
}
