import type { IQuoteRequestRepository, QuoteRequest } from "../../domain";
import type { ApiClient } from "../http/ApiClient";

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string): string {
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

export class QuoteRequestApiRepository implements IQuoteRequestRepository {
  constructor(private readonly api: ApiClient) {}

  async getAll(): Promise<QuoteRequest[]> {
    const requests = await this.api.get<QuoteRequest[]>("/quote-requests");
    return (requests ?? []).map((r) => ({ ...r, createdAt: utc(r.createdAt) }));
  }

  async getById(id: number): Promise<QuoteRequest | null> {
    const request = await this.api.get<QuoteRequest>(`/quote-requests/${id}`);
    return request && { ...request, createdAt: utc(request.createdAt) };
  }

  async getPendingCount(): Promise<number> {
    return (await this.api.get<{ count: number }>("/quote-requests/pending-count"))?.count ?? 0;
  }
}
