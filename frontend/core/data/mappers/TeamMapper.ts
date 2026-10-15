import type { Absence, AbsenceReason, DaySchedule, EmployeeRole, TeamMember } from "../../domain";
import type { AbsenceDto, DayScheduleDto, TeamMemberDto } from "../dto/TeamDto";

const roles: EmployeeRole[] = ["mechanic", "manager", "reception"];
const reasons: AbsenceReason[] = ["leave", "sick", "training", "other"];

function oneOf<T extends string>(values: T[], value: string, fallback: T): T {
  const v = value?.toLowerCase() as T;
  return values.includes(v) ? v : fallback;
}

export function toDaySchedule(dto: DayScheduleDto): DaySchedule {
  return {
    dayOfWeek: dto.dayOfWeek,
    start: dto.start,
    end: dto.end,
    breakStart: dto.breakStart,
    breakEnd: dto.breakEnd,
  };
}

export function toAbsence(dto: AbsenceDto): Absence {
  return {
    id: dto.id,
    startDate: dto.startDate,
    endDate: dto.endDate,
    reason: oneOf(reasons, dto.reason, "other"),
    comment: dto.comment,
  };
}

export function toTeamMember(dto: TeamMemberDto): TeamMember {
  return {
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: oneOf(roles, dto.role, "mechanic"),
    phone: dto.phone,
    email: dto.email,
    schedule: (dto.schedule ?? []).map(toDaySchedule),
    absences: (dto.absences ?? []).map(toAbsence),
  };
}
