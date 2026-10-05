import { AppointmentStatus, type InterventionStatus, type Status } from "./status";

export type Appointment = {
  id: number;
  reference: string;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  status: Status<AppointmentStatus>;
  /** Début du rendez-vous, ISO 8601 en UTC. */
  scheduledAt: string;
  estimatedEndAt: string;
  customerNotes: string | null;
  garageId: number;
  garageName: string;
  garageAddress: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  serviceCodes: string[];
  serviceNames: string[];
  /** Intervention ouverte à partir du rendez-vous (null si pas encore lancé). */
  interventionId: number | null;
  interventionStatus: Status<InterventionStatus> | null;
};

/** Demande de rendez-vous. */
export type AppointmentRequest = {
  customerId: number;
  garageId: number;
  serviceIds: number[];
  /** Heure locale du garage, "2026-10-05T09:30". */
  scheduledAt: string;
  /** Véhicule existant du client, ou immatriculation (créé s'il est inconnu). */
  vehicleId?: number;
  plate?: string;
  mileage?: number;
  customerNotes?: string;
};

/** Rendez-vous enregistré. */
export type BookedAppointment = {
  id: number;
  reference: string;
  scheduledAt: string;
  estimatedEndAt: string;
};

/** Rendez-vous encore ouvert : en attente ou confirmé. */
export function isOpen(appointment: Appointment): boolean {
  const id = appointment.status.id;
  return id === AppointmentStatus.Pending || id === AppointmentStatus.Confirmed;
}

/** Un rendez-vous à venir, en attente ou confirmé, peut encore être annulé (par le client). */
export function isCancellable(appointment: Appointment, now = new Date()): boolean {
  return isOpen(appointment) && new Date(appointment.scheduledAt) > now;
}

// Actions du garage (back-office).

/** Le garage peut déplacer un rendez-vous ouvert qui n'a pas commencé. */
export function canReschedule(appointment: Appointment, now = new Date()): boolean {
  return isOpen(appointment) && new Date(appointment.scheduledAt) > now;
}

/** Le client peut être noté absent à partir de l'heure du rendez-vous. */
export function canMarkNoShow(appointment: Appointment, now = new Date()): boolean {
  return isOpen(appointment) && new Date(appointment.scheduledAt) <= now;
}

/** Un rendez-vous ouvert se lance le jour prévu (jour local du navigateur, celui du garage). */
export function canStart(appointment: Appointment, now = new Date()): boolean {
  return isOpen(appointment) && new Date(appointment.scheduledAt).toDateString() === now.toDateString();
}

/** Abandon par le garage : annulé, ou client non venu. */
export type AbandonStatus = typeof AppointmentStatus.Cancelled | typeof AppointmentStatus.NoShow;

/** Vérification avant le lancement d'un rendez-vous à une heure donnée (non bloquante). */
export type StartCheck = {
  /** Un mécanicien est libre pour tout le travail ; sinon le lancement reste possible. */
  possible: boolean;
  message: string | null;
  /** Début et fin estimée (UTC, ISO 8601), pauses comprises. */
  startAt: string;
  estimatedEndAt: string;
  /** Premier mécanicien libre, affecté au lancement. */
  employeeId: number | null;
  employeeName: string | null;
};

/**
 * Statut affiché au garage : celui du rendez-vous, puis celui de son intervention une fois lancée
 * (en cours, terminée, facturée, clôturée...). Les libellés viennent des tables de statuts.
 */
export type AppointmentDisplayStatus =
  | { kind: "appointment"; status: Status<AppointmentStatus> }
  | { kind: "intervention"; status: Status<InterventionStatus> };

export function appointmentDisplayStatus(appointment: Appointment): AppointmentDisplayStatus {
  return appointment.interventionStatus
    ? { kind: "intervention", status: appointment.interventionStatus }
    : { kind: "appointment", status: appointment.status };
}
