import type { Appointment } from "../entities/appointment";
import type { IAppointmentRepository } from "../repositories/IAppointmentRepository";

/** Rendez-vous d'un garage sur une période (jours inclus, heure locale), du plus tôt au plus tard. */
export class GetGarageAppointments {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(garageId: number, from: string, to: string): Promise<Appointment[]> {
    const appointments = await this.repository.getAppointments({ garageId, from, to });
    return [...appointments].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
}
