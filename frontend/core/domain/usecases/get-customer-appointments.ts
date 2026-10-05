import type { Appointment } from "../entities/appointment";
import type { AppointmentRepository } from "../repositories/appointment-repository";

/** Rendez-vous d'un client, du plus récent au plus ancien. */
export class GetCustomerAppointments {
  constructor(private readonly repository: AppointmentRepository) {}

  async execute(customerId: number, options: { upcomingOnly?: boolean } = {}): Promise<Appointment[]> {
    const appointments = await this.repository.getAppointments({ customerId, upcomingOnly: options.upcomingOnly });
    return [...appointments].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  }
}
