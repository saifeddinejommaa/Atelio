import { AppointmentStatus, isCancellable, type Appointment as AppointmentEntity } from "@atelio/core/domain";

// L'API renvoie les dates en UTC : on les affiche à l'heure des garages.
const GARAGE_TIME_ZONE = "Europe/Paris";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: GARAGE_TIME_ZONE,
});
const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: GARAGE_TIME_ZONE });

/** Rendez-vous tel qu'affiché dans « Mes rendez-vous ». */
export type Appointment = {
  reference: string;
  status: AppointmentStatus;
  /** Libellé de la table appointment_status. */
  statusLabel: string;
  /** "lundi 5 octobre 2026" */
  date: string;
  /** "09h30" */
  time: string;
  garageName: string;
  garageAddress: string;
  plate: string;
  services: string[];
  notes: string | null;
  upcoming: boolean;
  cancellable: boolean;
};

export function toAppointment(entity: AppointmentEntity, now = new Date()): Appointment {
  const start = new Date(entity.scheduledAt);
  return {
    reference: entity.reference,
    status: entity.status.id,
    statusLabel: entity.status.label,
    date: dateFormat.format(start),
    time: timeFormat.format(start).replace(":", "h"),
    garageName: entity.garageName,
    garageAddress: entity.garageAddress,
    plate: entity.vehiclePlate,
    services: entity.serviceNames,
    notes: entity.customerNotes,
    upcoming: start > now && entity.status.id !== AppointmentStatus.Cancelled,
    cancellable: isCancellable(entity, now),
  };
}
