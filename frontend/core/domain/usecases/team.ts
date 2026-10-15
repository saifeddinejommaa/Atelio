import type { Absence, DaySchedule, NewAbsence, NewTeamMember, TeamMember } from "../entities/team";
import { ValidationError } from "../errors";
import type { ITeamRepository } from "../repositories/ITeamRepository";

const dayNames = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const TIME = /^\d{2}:\d{2}$/;

/** Équipe du garage sur une période (absences comprises). */
export class GetTeam {
  constructor(private readonly repository: ITeamRepository) {}

  execute(garageId: number, from: string, to: string): Promise<TeamMember[]> {
    return this.repository.getTeam(garageId, from, to);
  }
}

/** Enregistre le planning type : une journée par jour travaillé, avec une pause facultative. */
export class SaveEmployeeSchedule {
  constructor(private readonly repository: ITeamRepository) {}

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
  constructor(private readonly repository: ITeamRepository) {}

  async execute(employeeId: number, absence: NewAbsence): Promise<Absence> {
    if (!absence.startDate || !absence.endDate) throw new ValidationError("Indiquez le premier et le dernier jour.");
    if (absence.endDate < absence.startDate) throw new ValidationError("Le dernier jour doit être après le premier.");
    return this.repository.declareAbsence(employeeId, { ...absence, comment: absence.comment?.trim() || null });
  }
}

/** Ajoute un employé au garage (prénom, nom, rôle ; téléphone et e-mail facultatifs). */
export class AddTeamMember {
  constructor(private readonly repository: ITeamRepository) {}

  async execute(garageId: number, member: NewTeamMember): Promise<number> {
    const firstName = member.firstName.trim();
    const lastName = member.lastName.trim();
    if (!firstName) throw new ValidationError("Indiquez le prénom.");
    if (!lastName) throw new ValidationError("Indiquez le nom.");
    const email = member.email?.trim() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("L'e-mail n'est pas valide.");
    return this.repository.addMember(garageId, { firstName, lastName, role: member.role, phone: member.phone?.trim() || null, email });
  }
}

/** L'employé quitte l'équipe et le planning (son historique reste). */
export class DeactivateTeamMember {
  constructor(private readonly repository: ITeamRepository) {}

  execute(employeeId: number): Promise<void> {
    return this.repository.deactivateMember(employeeId);
  }
}

export class DeleteAbsence {
  constructor(private readonly repository: ITeamRepository) {}

  execute(employeeId: number, absenceId: number): Promise<void> {
    return this.repository.deleteAbsence(employeeId, absenceId);
  }
}
