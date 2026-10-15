import type { Invoice, IInvoiceRepository, InvoiceFilter, InvoicePage, InvoiceStatus, InvoiceSummary, PaymentMethod } from "../../domain";
import type { PageDto } from "../dto/PageDto";
import { ApiError, type ApiClient } from "../http/ApiClient";

/** Réponse de GET /api/invoices/{id}. */
export type InvoiceDto = Omit<Invoice, "status" | "paymentMethod" | "lines" | "payments" | "documents"> & {
  /** Id et libellé de la table invoice_status. */
  statusId: number;
  statusLabel: string;
  paymentMethod: string | null;
  payments: { paidAt: string; method: string; amount: number }[];
  documents: { version: number; createdAt: string }[];
  lines: {
    kind: string;
    label: string;
    reference: string | null;
    description: string | null;
    quantity: number;
    unitPrice: number;
    discountPercent: number | null;
    discountLabel: string | null;
    total: number;
  }[];
};

/** Élément de GET /api/invoices. */
type InvoiceSummaryDto = Omit<InvoiceSummary, "status"> & { statusId: number; statusLabel: string };

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string | null): string | null {
  if (!date) return null;
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

function toInvoice(dto: InvoiceDto): Invoice {
  const { statusId, statusLabel, ...rest } = dto;
  return {
    ...rest,
    issuedAt: utc(dto.issuedAt) ?? dto.issuedAt,
    dueDate: dto.dueDate ? dto.dueDate.slice(0, 10) : null,
    // Ids fixes, partagés avec le backend : la conversion vers le type d'id est sûre.
    status: { id: statusId as InvoiceStatus, label: statusLabel },
    paymentMethod: (dto.paymentMethod?.toLowerCase() as PaymentMethod | undefined) ?? null,
    paidAt: utc(dto.paidAt),
    payments: (dto.payments ?? []).map((p) => ({
      paidAt: utc(p.paidAt) ?? p.paidAt,
      method: p.method.toLowerCase() as PaymentMethod,
      amount: p.amount,
    })),
    amountPaid: dto.amountPaid ?? 0,
    remaining: dto.remaining ?? dto.totalTtc,
    documents: (dto.documents ?? []).map((d) => ({ version: d.version, createdAt: utc(d.createdAt) ?? d.createdAt })),
    lines: (dto.lines ?? []).map((l) => ({
      ...l,
      description: l.description ?? null,
      discountPercent: l.discountPercent ?? null,
      discountLabel: l.discountLabel ?? null,
      kind: l.kind === "article" || l.kind === "part" ? l.kind : "labour",
    })),
  };
}

export class InvoiceApiRepository implements IInvoiceRepository {
  constructor(private readonly api: ApiClient) {}

  async getInvoices(filter: InvoiceFilter): Promise<InvoicePage> {
    const page = await this.api.get<PageDto<InvoiceSummaryDto> & { sumHt: number; sumTtc: number }>("/invoices", {
      garageId: filter.garageId,
      from: filter.from || undefined,
      to: filter.to || undefined,
      customer: filter.customer,
      plate: filter.plate,
      page: filter.page,
      pageSize: filter.pageSize,
    });
    return {
      items: (page?.items ?? []).map(({ statusId, statusLabel, ...rest }) => ({
        ...rest,
        issuedAt: utc(rest.issuedAt) ?? rest.issuedAt,
        // Ids fixes, partagés avec le backend : la conversion vers le type d'id est sûre.
        status: { id: statusId as InvoiceStatus, label: statusLabel },
      })),
      total: page?.total ?? 0,
      page: page?.page ?? 1,
      pageSize: page?.pageSize ?? filter.pageSize ?? 20,
      sumHt: page?.sumHt ?? 0,
      sumTtc: page?.sumTtc ?? 0,
    };
  }

  async getById(id: number): Promise<Invoice | null> {
    const invoice = await this.api.get<InvoiceDto>(`/invoices/${id}`);
    return invoice && toInvoice(invoice);
  }

  async finishIntervention(interventionId: number): Promise<void> {
    await this.api.post(`/interventions/${interventionId}/finish`, {});
  }

  async issue(interventionId: number, amountPaid: number, method: PaymentMethod | null): Promise<number> {
    const result = await this.api.post<{ invoiceId: number }>(`/interventions/${interventionId}/invoice`, {
      amountPaid,
      method: amountPaid > 0 ? method : null,
    });
    if (!result) throw new ApiError(500, "L'API n'a pas renvoyé la facture émise.");
    return result.invoiceId;
  }

  async pay(invoiceId: number, method: PaymentMethod, amount: number): Promise<void> {
    await this.api.post(`/invoices/${invoiceId}/pay`, { method, amount });
  }

  getPdf(invoiceId: number, version?: number): Promise<Blob | null> {
    return this.api.getFile(`/invoices/${invoiceId}/pdf`, { version });
  }

  async generatePdf(invoiceId: number): Promise<void> {
    await this.api.post(`/invoices/${invoiceId}/documents`, {});
  }
}
