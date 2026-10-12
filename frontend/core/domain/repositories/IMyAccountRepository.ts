import type { Appointment, BookedAppointment } from "../entities/appointment";
import type { Customer } from "../entities/customer";
import type { CustomerVehicle } from "../entities/CustomerVehicle";
import type { MyAppointmentRequest } from "../entities/CustomerLogin";

/** Compte du client connecté (routes /me de l'API, avec son jeton de session). */
export interface IMyAccountRepository {
  /** Profil du client, ou null si la session n'est plus valable. */
  getProfile(): Promise<Customer | null>;
  getAppointments(): Promise<Appointment[]>;
  getVehicles(): Promise<CustomerVehicle[]>;
  book(request: MyAppointmentRequest): Promise<BookedAppointment>;
  cancel(reference: string): Promise<void>;
}
