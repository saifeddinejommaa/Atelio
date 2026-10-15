import type { NewGarageQuote, GarageQuote, GarageQuoteSummary } from "../entities/GarageQuote";

export interface IQuoteRepository {
  getById(id: number): Promise<GarageQuote | null>;
  /** Devis du client, des plus récents aux plus anciens. */
  getByCustomer(customerId: number): Promise<GarageQuoteSummary[]>;
  /** Crée le devis et renvoie son identifiant. */
  create(quote: NewGarageQuote): Promise<number>;
  /** Envoie le devis par e-mail au client. */
  send(id: number): Promise<void>;
}
