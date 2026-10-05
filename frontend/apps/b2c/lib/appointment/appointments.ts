import { isCancellable, type Appointment as AppointmentEntity, type AppointmentStatus } from "@atelio/core/domain";

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

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  completed: "Terminé",
  no_show: "Non honoré",
};

/** Rendez-vous tel qu'affiché dans « Mes rendez-vous ». */
export type Appointment = {
  reference: string;
  status: AppointmentStatus;
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
    status: entity.status,
    statusLabel: statusLabels[entity.status],
    date: dateFormat.format(start),
    time: timeFormat.format(start).replace(":", "h"),
    garageName: entity.garageName,
    garageAddress: entity.garageAddress,
    plate: entity.vehiclePlate,
    services: entity.serviceNames,
    notes: entity.customerNotes,
    upcoming: start > now && entity.status !== "cancelled",
    cancellable: isCancellable(entity, now),
  };
}
