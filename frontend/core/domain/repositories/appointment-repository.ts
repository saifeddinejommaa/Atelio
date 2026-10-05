import type {
  AbandonStatus,
  Appointment,
  AppointmentRequest,
  BookedAppointment,
  StartCheck,
} from "../entities/appointment";
import type { AppointmentStatus } from "../entities/status";

export type AppointmentFilter = {
  customerId?: number;
  garageId?: number;
  statusId?: AppointmentStatus;
  upcomingOnly?: boolean;
  /** Premier jour inclus, heure locale du garage, "2026-10-01". */
  from?: string;
  /** Dernier jour inclus, heure locale du garage, "2026-10-31". */
  to?: string;
};

export interface AppointmentRepository {
  getAppointments(filter: AppointmentFilter): Promise<Appointment[]>;
  getByReference(reference: string): Promise<Appointment | null>;
  book(request: AppointmentRequest): Promise<BookedAppointment>;
  /** Annulation par le client titulaire. */
  cancel(reference: string, customerId: number): Promise<void>;
  /** Garage : nouvelle heure locale, "2026-10-12T14:00". */
  reschedule(reference: string, scheduledAt: string): Promise<void>;
  /** Garage : annulé ou client non venu. */
  abandon(reference: string, status: AbandonStatus): Promise<void>;
  /** Garage : ouvre l'intervention et renvoie son identifiant.
   *  startAt : début réel, heure locale "2026-10-12T14:20" (par défaut maintenant). */
  start(reference: string, startAt?: string): Promise<number>;
  /** Garage : avant de lancer à cette heure, premier mécanicien libre et fin estimée. */
  checkStart(reference: string, startAt?: string): Promise<StartCheck>;
}
