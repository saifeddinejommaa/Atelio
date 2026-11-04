import type { NewGarageQuote, GarageQuote, GarageQuoteChanges, GarageQuoteSummary } from "../entities/GarageQuote";
import { ValidationError } from "../errors";
import type { IQuoteRepository } from "../repositories/IQuoteRepository";

function checkLines(lines: NewGarageQuote["lines"]): void {
  if (lines.some((l) => !(l.quantity > 0))) throw new ValidationError("La quantité doit être supérieure à 0.");
  if (lines.some((l) => l.unitPriceHt !== undefined && !(l.unitPriceHt >= 0))) throw new ValidationError("Le prix doit être un montant positif.");
}

export class GetQuote {
  constructor(private readonly repository: IQuoteRepository) {}

  execute(id: number): Promise<GarageQuote | null> {
    return this.repository.getById(id);
  }
}

export class GetCustomerQuotes {
  constructor(private readonly repository: IQuoteRepository) {}

  execute(customerId: number): Promise<GarageQuoteSummary[]> {
    return this.repository.getByCustomer(customerId);
  }
}

/** Crée un devis : un véhicule du client et au moins un article (l'API copie les prix HT du catalogue). */
export class CreateQuote {
  constructor(private readonly repository: IQuoteRepository) {}

  async execute(quote: NewGarageQuote): Promise<number> {
    if (!quote.vehicleId) throw new ValidationError("Choisissez le véhicule.");
    if (quote.lines.length === 0) throw new ValidationError("Ajoutez au moins un article.");
    checkLines(quote.lines);
    return this.repository.create(quote);
  }
}

/** Modifie un devis ni envoyé ni importé (l'API le vérifie). */
export class UpdateQuote {
  constructor(private readonly repository: IQuoteRepository) {}

  async execute(id: number, changes: GarageQuoteChanges): Promise<void> {
    if (!changes.vehicleId) throw new ValidationError("Choisissez le véhicule.");
    if (changes.lines.length === 0) throw new ValidationError("Ajoutez au moins un article.");
    checkLines(changes.lines);
    return this.repository.update(id, changes);
  }
}

/** Envoie le devis par e-mail au client (il doit avoir une adresse e-mail). */
export class SendQuote {
  constructor(private readonly repository: IQuoteRepository) {}

  execute(id: number): Promise<void> {
    return this.repository.send(id);
  }
}
