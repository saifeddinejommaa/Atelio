import type { AppointmentRequest, BookedAppointment } from "../entities/appointment";
import type { MyAppointmentRequest } from "../entities/CustomerLogin";
import { ValidationError } from "../errors";
import type { IAppointmentRepository } from "../repositories/IAppointmentRepository";
import type { IMyAccountRepository } from "../repositories/IMyAccountRepository";
import { formatPlate, isValidPlate } from "../rules/plate";

export const MAX_NOTES_LENGTH = 1000;

/** Règles simples vérifiées ici pour répondre vite ; l'API contrôle ensuite garage, prestations et créneau. */
function checkBooking<T extends MyAppointmentRequest>(request: T): T {
  if (request.serviceIds.length === 0) throw new ValidationError("Choisissez au moins une prestation.");
  if (request.vehicleId === undefined && !isValidPlate(request.plate ?? ""))
    throw new ValidationError("Immatriculation invalide (format AB-123-CD).");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(request.scheduledAt)) throw new ValidationError("Choisissez un créneau.");
  if (request.mileage !== undefined && (!Number.isInteger(request.mileage) || request.mileage < 0))
    throw new ValidationError("Kilométrage invalide.");
  if ((request.customerNotes?.length ?? 0) > MAX_NOTES_LENGTH)
    throw new ValidationError(`Votre message est trop long (${MAX_NOTES_LENGTH} caractères max).`);

  return {
    ...request,
    plate: request.plate && formatPlate(request.plate.trim()),
    customerNotes: request.customerNotes?.trim() || undefined,
  };
}

/** Prend un rendez-vous pour un client donné (back-office). */
export class BookAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(request: AppointmentRequest): Promise<BookedAppointment> {
    return this.repository.book(checkBooking(request));
  }
}

/** Prend un rendez-vous pour le client connecté (site b2c). */
export class BookMyAppointment {
  constructor(private readonly repository: IMyAccountRepository) {}

  async execute(request: MyAppointmentRequest): Promise<BookedAppointment> {
    return this.repository.book(checkBooking(request));
  }
}
