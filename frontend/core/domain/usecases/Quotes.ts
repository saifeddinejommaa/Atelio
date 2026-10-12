import type { NewGarageQuote, GarageQuote, GarageQuoteSummary } from "../entities/GarageQuote";
import { ValidationError } from "../errors";
import type { IQuoteRepository } from "../repositories/IQuoteRepository";

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
    if (quote.lines.some((l) => !(l.quantity > 0))) throw new ValidationError("La quantité doit être supérieure à 0.");
    return this.repository.create(quote);
  }
}

/** Envoie le devis par e-mail au client (il doit avoir une adresse e-mail). */
export class SendQuote {
  constructor(private readonly repository: IQuoteRepository) {}

  execute(id: number): Promise<void> {
    return this.repository.send(id);
  }
}
