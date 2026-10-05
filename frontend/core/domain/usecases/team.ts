import type { Absence, DaySchedule, NewAbsence, TeamMember } from "../entities/team";
import { ValidationError } from "../errors";
import type { TeamRepository } from "../repositories/team-repository";

const dayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const TIME = /^\d{2}:\d{2}$/;

/** Équipe du garage sur une période (absences comprises). */
export class GetTeam {
  constructor(private readonly repository: TeamRepository) {}

  execute(garageId: number, from: string, to: string): Promise<TeamMember[]> {
    return this.repository.getTeam(garageId, from, to);
  }
}

/** Enregistre le planning type : une journée par jour travaillé, avec une pause facultative. */
export class SaveEmployeeSchedule {
  constructor(private readonly repository: TeamRepository) {}

  async execute(employeeId: number, days: DaySchedule[]): Promise<DaySchedule[]> {
    for (const day of days) {
      const name = dayNames[day.dayOfWeek - 1];
      if (!TIME.test(day.start) || !TIME.test(day.end)) throw new ValidationError(`Heures invalides le ${name}.`);
      if (day.end <= day.start) throw new ValidationError(`Le ${name}, le départ doit être après l'arrivée.`);

      const hasBreak = !!day.breakStart || !!day.breakEnd;
      if (!hasBreak) continue;
      if (!day.breakStart || !day.breakEnd) {
        throw new ValidationError(`Le ${name}, indiquez le début et la fin de la pause, ou aucune des deux.`);
      }
      if (!(day.start < day.breakStart && day.breakStart < day.breakEnd && day.breakEnd < day.end)) {
        throw new ValidationError(`Le ${name}, la pause doit être comprise dans la journée.`);
      }
    }
    return this.repository.saveSchedule(employeeId, days);
  }
}

/** Déclare une absence en jours entiers. */
export class DeclareAbsence {
  constructor(private readonly repository: TeamRepository) {}

  async execute(employeeId: number, absence: NewAbsence): Promise<Absence> {
    if (!absence.startDate || !absence.endDate) throw new ValidationError("Indiquez le premier et le dernier jour.");
    if (absence.endDate < absence.startDate) throw new ValidationError("Le dernier jour doit être après le premier.");
    return this.repository.declareAbsence(employeeId, { ...absence, comment: absence.comment?.trim() || null });
  }
}

export class DeleteAbsence {
  constructor(private readonly repository: TeamRepository) {}

  execute(employeeId: number, absenceId: number): Promise<void> {
    return this.repository.deleteAbsence(employeeId, absenceId);
  }
}
