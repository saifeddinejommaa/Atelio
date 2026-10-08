import type { AppointmentRequest, BookedAppointment } from "../entities/appointment";
import { ValidationError } from "../errors";
import type { IAppointmentRepository } from "../repositories/IAppointmentRepository";
import { formatPlate, isValidPlate } from "../rules/plate";

export const MAX_NOTES_LENGTH = 1000;

/**
 * Prend un rendez-vous. Les règles simples sont vérifiées ici pour répondre vite ;
 * l'API contrôle ensuite le garage, les prestations et la disponibilité du créneau.
 */
export class BookAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(request: AppointmentRequest): Promise<BookedAppointment> {
    if (request.serviceIds.length === 0) throw new ValidationError("Choisissez au moins une prestation.");
    if (request.vehicleId === undefined && !isValidPlate(request.plate ?? ""))
      throw new ValidationError("Immatriculation invalide (format AB-123-CD).");
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(request.scheduledAt)) throw new ValidationError("Choisissez un créneau.");
    if (request.mileage !== undefined && (!Number.isInteger(request.mileage) || request.mileage < 0))
      throw new ValidationError("Kilométrage invalide.");
    if ((request.customerNotes?.length ?? 0) > MAX_NOTES_LENGTH)
      throw new ValidationError(`Votre message est trop long (${MAX_NOTES_LENGTH} caractères max).`);

    return this.repository.book({
      ...request,
      plate: request.plate && formatPlate(request.plate.trim()),
      customerNotes: request.customerNotes?.trim() || undefined,
    });
  }
}
