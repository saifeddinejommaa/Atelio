import type { PaymentMethod } from "../entities/intervention";
import type { Invoice, InvoiceFilter, InvoicePage } from "../entities/invoice";
import { ValidationError } from "../errors";
import type { IInvoiceRepository } from "../repositories/IInvoiceRepository";

// Fin d'intervention : Terminer les travaux (prête) → Facturer (avec le premier règlement)
// → Encaisser les règlements suivants → clôturée quand tout est payé.

export class FinishIntervention {
  constructor(private readonly repository: IInvoiceRepository) {}

  execute(interventionId: number): Promise<void> {
    return this.repository.finishIntervention(interventionId);
  }
}

/** Émet la facture avec le montant reçu tout de suite (0 : tout reste à payer, au plus le total). */
export class IssueInvoice {
  constructor(private readonly repository: IInvoiceRepository) {}

  async execute(interventionId: number, amountPaid: number, method: PaymentMethod | null, totalTtc: number): Promise<number> {
    if (!Number.isFinite(amountPaid) || amountPaid < 0) throw new ValidationError("Indiquez un montant reçu valide (0 si rien n'est réglé).");
    if (amountPaid > totalTtc) throw new ValidationError("Le montant reçu dépasse le total de la facture.");
    if (amountPaid > 0 && !method) throw new ValidationError("Choisissez le moyen de paiement.");
    return this.repository.issue(interventionId, round2(amountPaid), method);
  }
}

/** Encaisse un règlement, au plus le reste à payer. */
export class PayInvoice {
  constructor(private readonly repository: IInvoiceRepository) {}

  async execute(invoiceId: number, method: PaymentMethod, amount: number, remaining: number): Promise<void> {
    if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError("Indiquez le montant reçu.");
    if (round2(amount) > round2(remaining)) throw new ValidationError("Le montant dépasse le reste à payer.");
    return this.repository.pay(invoiceId, method, round2(amount));
  }
}

/** PDF stocké de la facture (dernière version par défaut). */
export class GetInvoicePdf {
  constructor(private readonly repository: IInvoiceRepository) {}

  execute(invoiceId: number, version?: number): Promise<Blob | null> {
    return this.repository.getPdf(invoiceId, version);
  }
}

/** Génère le PDF d'une facture qui n'en a pas encore (émise avant les PDF). */
export class GenerateInvoicePdf {
  constructor(private readonly repository: IInvoiceRepository) {}

  execute(invoiceId: number): Promise<void> {
    return this.repository.generatePdf(invoiceId);
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Factures du back-office : période d'émission, client, immatriculation. */
export class GetInvoices {
  constructor(private readonly repository: IInvoiceRepository) {}

  execute(filter: InvoiceFilter): Promise<InvoicePage> {
    if (filter.from && filter.to && filter.from > filter.to) throw new ValidationError("La date de début est après la date de fin.");
    return this.repository.getInvoices({ ...filter, customer: filter.customer?.trim() || undefined, plate: filter.plate?.trim() || undefined });
  }
}

export class GetInvoice {
  constructor(private readonly repository: IInvoiceRepository) {}

  execute(id: number): Promise<Invoice | null> {
    return this.repository.getById(id);
  }
}
