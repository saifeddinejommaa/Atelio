import type { AppointmentRepository } from "../repositories/appointment-repository";

/** Annule un rendez-vous du client. L'API vérifie qu'il en est le titulaire et qu'il est encore annulable. */
export class CancelAppointment {
  constructor(private readonly repository: AppointmentRepository) {}

  execute(reference: string, customerId: number): Promise<void> {
    return this.repository.cancel(reference, customerId);
  }
}
