import type { NewQuoteRequest, QuoteRequest } from "../entities/QuoteRequest";
import { ValidationError } from "../errors";
import type { IMyAccountRepository } from "../repositories/IMyAccountRepository";
import type { IQuoteRequestRepository } from "../repositories/IQuoteRequestRepository";
import { formatPlate, isValidPlate } from "../rules/plate";
import { MAX_NOTES_LENGTH } from "./BookAppointment";

export class GetQuoteRequests {
  constructor(private readonly repository: IQuoteRequestRepository) {}

  execute(): Promise<QuoteRequest[]> {
    return this.repository.getAll();
  }
}

export class GetQuoteRequest {
  constructor(private readonly repository: IQuoteRequestRepository) {}

  execute(id: number): Promise<QuoteRequest | null> {
    return this.repository.getById(id);
  }
}

export class GetPendingQuoteRequestCount {
  constructor(private readonly repository: IQuoteRequestRepository) {}

  execute(): Promise<number> {
    return this.repository.getPendingCount();
  }
}

/** Demande de devis du client connecté. */
export class RequestMyQuote {
  constructor(private readonly repository: IMyAccountRepository) {}

  execute(request: NewQuoteRequest): Promise<void> {
    if (!isValidPlate(request.plate)) throw new ValidationError("Immatriculation invalide (format AB-123-CD).");
    if (request.serviceIds.length === 0) throw new ValidationError("Choisissez au moins une prestation.");
    if ((request.message?.length ?? 0) > MAX_NOTES_LENGTH)
      throw new ValidationError(`Votre message est trop long (${MAX_NOTES_LENGTH} caractères max).`);

    return this.repository.requestQuote({
      ...request,
      plate: formatPlate(request.plate.trim()),
      message: request.message?.trim() || undefined,
    });
  }
}
