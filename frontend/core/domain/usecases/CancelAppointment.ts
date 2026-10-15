import type { IAppointmentRepository } from "../repositories/IAppointmentRepository";

/** Annule un rendez-vous du client. L'API vérifie qu'il en est le titulaire et qu'il est encore annulable. */
export class CancelAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  execute(reference: string, customerId: number): Promise<void> {
    return this.repository.cancel(reference, customerId);
  }
}
