import type { QuoteRequest } from "../entities/QuoteRequest";

export interface IQuoteRequestRepository {
  /** Demandes à traiter d'abord, puis les plus récentes. */
  getAll(): Promise<QuoteRequest[]>;
  getById(id: number): Promise<QuoteRequest | null>;
  /** Nombre de demandes à traiter. */
  getPendingCount(): Promise<number>;
}
