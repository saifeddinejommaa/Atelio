import type { PaymentMethod } from "../entities/intervention";
import type { Invoice } from "../entities/invoice";
import type { InvoiceRepository } from "../repositories/invoice-repository";

// Fin d'intervention : Terminer les travaux (prête) → Facturer → Encaisser (clôturée).

export class FinishIntervention {
  constructor(private readonly repository: InvoiceRepository) {}

  execute(interventionId: number): Promise<void> {
    return this.repository.finishIntervention(interventionId);
  }
}

export class IssueInvoice {
  constructor(private readonly repository: InvoiceRepository) {}

  execute(interventionId: number): Promise<number> {
    return this.repository.issue(interventionId);
  }
}

export class PayInvoice {
  constructor(private readonly repository: InvoiceRepository) {}

  execute(invoiceId: number, method: PaymentMethod): Promise<void> {
    return this.repository.pay(invoiceId, method);
  }
}

export class GetInvoice {
  constructor(private readonly repository: InvoiceRepository) {}

  execute(id: number): Promise<Invoice | null> {
    return this.repository.getById(id);
  }
}
