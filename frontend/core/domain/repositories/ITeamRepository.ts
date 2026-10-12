import type { Absence, DaySchedule, NewAbsence, TeamMember } from "../entities/team";

export interface ITeamRepository {
  /** Employés actifs du garage, avec leurs absences sur [from, to] (jours locaux inclus). */
  getTeam(garageId: number, from: string, to: string): Promise<TeamMember[]>;
  /** Remplace le planning type de l'employé (jours travaillés uniquement) ; renvoie le planning enregistré. */
  saveSchedule(employeeId: number, days: DaySchedule[]): Promise<DaySchedule[]>;
  declareAbsence(employeeId: number, absence: NewAbsence): Promise<Absence>;
  deleteAbsence(employeeId: number, absenceId: number): Promise<void>;
}
