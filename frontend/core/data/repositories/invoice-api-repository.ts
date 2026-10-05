import type { Invoice, InvoiceRepository, InvoiceStatus, PaymentMethod } from "../../domain";
import { ApiError, type ApiClient } from "../http/api-client";

/** Réponse de GET /api/invoices/{id}. */
export type InvoiceDto = Omit<Invoice, "status" | "paymentMethod" | "lines"> & {
  status: string;
  paymentMethod: string | null;
  lines: { kind: string; label: string; reference: string | null; quantity: number; unitPrice: number; total: number }[];
};

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string | null): string | null {
  if (!date) return null;
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

function toInvoice(dto: InvoiceDto): Invoice {
  return {
    ...dto,
    issuedAt: utc(dto.issuedAt) ?? dto.issuedAt,
    dueDate: dto.dueDate ? dto.dueDate.slice(0, 10) : null,
    status: dto.status.toLowerCase() as InvoiceStatus,
    paymentMethod: (dto.paymentMethod?.toLowerCase() as PaymentMethod | undefined) ?? null,
    paidAt: utc(dto.paidAt),
    lines: (dto.lines ?? []).map((l) => ({ ...l, kind: l.kind === "part" ? "part" : "labour" })),
  };
}

export class InvoiceApiRepository implements InvoiceRepository {
  constructor(private readonly api: ApiClient) {}

  async getById(id: number): Promise<Invoice | null> {
    const invoice = await this.api.get<InvoiceDto>(`/invoices/${id}`);
    return invoice && toInvoice(invoice);
  }

  async finishIntervention(interventionId: number): Promise<void> {
    await this.api.post(`/interventions/${interventionId}/finish`, {});
  }

  async issue(interventionId: number): Promise<number> {
    const result = await this.api.post<{ invoiceId: number }>(`/interventions/${interventionId}/invoice`, {});
    if (!result) throw new ApiError(500, "L'API n'a pas renvoyé la facture émise.");
    return result.invoiceId;
  }

  async pay(invoiceId: number, method: PaymentMethod): Promise<void> {
    await this.api.post(`/invoices/${invoiceId}/pay`, { method });
  }
}
