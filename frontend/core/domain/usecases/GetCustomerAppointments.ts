import type { Appointment } from "../entities/appointment";
import type { IAppointmentRepository } from "../repositories/IAppointmentRepository";

/** Rendez-vous d'un client, du plus récent au plus ancien. */
export class GetCustomerAppointments {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(customerId: number, options: { upcomingOnly?: boolean } = {}): Promise<Appointment[]> {
    const appointments = await this.repository.getAppointments({ customerId, upcomingOnly: options.upcomingOnly });
    return [...appointments].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  }
}
