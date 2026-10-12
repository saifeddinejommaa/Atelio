import type { Absence, DaySchedule, NewAbsence, TeamMember, ITeamRepository } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";
import type { AbsenceDto, DayScheduleDto, TeamMemberDto } from "../dto/TeamDto";
import { toAbsence, toDaySchedule, toTeamMember } from "../mappers/TeamMapper";

export class TeamApiRepository implements ITeamRepository {
  constructor(private readonly api: ApiClient) {}

  async getTeam(garageId: number, from: string, to: string): Promise<TeamMember[]> {
    const team = await this.api.get<TeamMemberDto[]>(`/garages/${garageId}/team`, { from, to });
    return (team ?? []).map(toTeamMember);
  }

  async saveSchedule(employeeId: number, days: DaySchedule[]): Promise<DaySchedule[]> {
    const saved = await this.api.put<DayScheduleDto[]>(`/employees/${employeeId}/schedule`, { days });
    return (saved ?? []).map(toDaySchedule);
  }

  async declareAbsence(employeeId: number, absence: NewAbsence): Promise<Absence> {
    const created = await this.api.post<AbsenceDto>(`/employees/${employeeId}/absences`, absence);
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé l'absence créée.");
    return toAbsence(created);
  }

  async deleteAbsence(employeeId: number, absenceId: number): Promise<void> {
    await this.api.delete(`/employees/${employeeId}/absences/${absenceId}`);
  }
}
