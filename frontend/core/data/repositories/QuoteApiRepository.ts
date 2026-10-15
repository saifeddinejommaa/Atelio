import type { IQuoteRepository, NewGarageQuote, GarageQuote, GarageQuoteSummary } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string): string {
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

export class QuoteApiRepository implements IQuoteRepository {
  constructor(private readonly api: ApiClient) {}

  async getById(id: number): Promise<GarageQuote | null> {
    const quote = await this.api.get<GarageQuote>(`/quotes/${id}`);
    return quote && { ...quote, createdAt: utc(quote.createdAt), lines: quote.lines ?? [] };
  }

  async getByCustomer(customerId: number): Promise<GarageQuoteSummary[]> {
    const quotes = await this.api.get<GarageQuoteSummary[]>(`/customers/${customerId}/quotes`);
    return (quotes ?? []).map((q) => ({ ...q, createdAt: utc(q.createdAt) }));
  }

  async create(quote: NewGarageQuote): Promise<number> {
    const created = await this.api.post<{ id: number }>("/quotes", quote);
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé le devis créé.");
    return created.id;
  }

  async send(id: number): Promise<void> {
    await this.api.post(`/quotes/${id}/send`, {});
  }
}
