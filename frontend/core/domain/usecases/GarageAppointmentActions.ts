import type { AbandonStatus, StartCheck } from "../entities/appointment";
import { ValidationError } from "../errors";
import type { IAppointmentRepository } from "../repositories/IAppointmentRepository";

// Actions du garage sur un rendez-vous. L'API vérifie le statut, les horaires et la disponibilité.

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Déplace un rendez-vous (même durée de travail). */
export class RescheduleAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(reference: string, scheduledAt: string): Promise<void> {
    if (!LOCAL_DATE_TIME.test(scheduledAt)) throw new ValidationError("Choisissez un jour et une heure.");
    return this.repository.reschedule(reference, scheduledAt);
  }
}

/** Abandonne un rendez-vous : annulé, ou client non venu. */
export class AbandonAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  execute(reference: string, status: AbandonStatus): Promise<void> {
    return this.repository.abandon(reference, status);
  }
}

/** Avant de lancer : premier mécanicien libre et fin estimée à cette heure (le jour même). */
export class CheckAppointmentStart {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(reference: string, startAt: string): Promise<StartCheck> {
    if (!LOCAL_DATE_TIME.test(startAt)) throw new ValidationError("Indiquez l'heure de début.");
    return this.repository.checkStart(reference, startAt);
  }
}

/**
 * Le client est là : le rendez-vous est recalé sur l'heure réelle de début et l'intervention est ouverte
 * (même sans mécanicien libre). Renvoie l'identifiant de l'intervention.
 */
export class StartAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(reference: string, startAt: string): Promise<number> {
    if (!LOCAL_DATE_TIME.test(startAt)) throw new ValidationError("Indiquez l'heure de début.");
    return this.repository.start(reference, startAt);
  }
}
