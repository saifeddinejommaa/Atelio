import type { Appointment } from "../entities/appointment";
import type { Customer } from "../entities/customer";
import type { CustomerVehicle } from "../entities/CustomerVehicle";
import type { IMyAccountRepository } from "../repositories/IMyAccountRepository";

/** Profil du client connecté, ou null si sa session n'est plus valable. */
export class GetMyProfile {
  constructor(private readonly repository: IMyAccountRepository) {}

  execute(): Promise<Customer | null> {
    return this.repository.getProfile();
  }
}

/** Rendez-vous du client connecté, du plus récent au plus ancien. */
export class GetMyAppointments {
  constructor(private readonly repository: IMyAccountRepository) {}

  execute(): Promise<Appointment[]> {
    return this.repository.getAppointments();
  }
}

export class GetMyVehicles {
  constructor(private readonly repository: IMyAccountRepository) {}

  execute(): Promise<CustomerVehicle[]> {
    return this.repository.getVehicles();
  }
}

/** Annule un rendez-vous du client connecté (l'API vérifie qu'il est encore annulable). */
export class CancelMyAppointment {
  constructor(private readonly repository: IMyAccountRepository) {}

  execute(reference: string): Promise<void> {
    return this.repository.cancel(reference);
  }
}
