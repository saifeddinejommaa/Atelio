export type EmployeeRole = "mechanic" | "manager" | "reception";

export type AbsenceReason = "leave" | "sick" | "training" | "other";

/** Journée type d'un employé, heures locales "08:30". Pause facultative. */
export type DaySchedule = {
  /** 1 = lundi ... 7 = dimanche. */
  dayOfWeek: number;
  start: string;
  end: string;
  breakStart: string | null;
  breakEnd: string | null;
};

/** Absence en jours entiers, premier et dernier jour inclus ("2026-10-12"). */
export type Absence = {
  id: number;
  startDate: string;
  endDate: string;
  reason: AbsenceReason;
  comment: string | null;
};

/** Absence à déclarer. */
export type NewAbsence = Omit<Absence, "id">;

/** Employé d'un garage, avec son planning type (jours travaillés) et ses absences sur la période demandée. */
export type TeamMember = {
  id: number;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
  phone: string | null;
  email: string | null;
  schedule: DaySchedule[];
  absences: Absence[];
};

/** "08:30" => 510 minutes. */
function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes travaillées sur une journée type (pause déduite). */
export function dayMinutes(day: DaySchedule): number {
  const pause = day.breakStart && day.breakEnd ? minutes(day.breakEnd) - minutes(day.breakStart) : 0;
  return minutes(day.end) - minutes(day.start) - pause;
}

/** Heures travaillées par semaine. */
export function weeklyHours(member: Pick<TeamMember, "schedule">): number {
  return member.schedule.reduce((sum, day) => sum + dayMinutes(day), 0) / 60;
}

/** Jour de la semaine (1 = lundi ... 7 = dimanche) d'une date "2026-10-12". */
export function isoDayOfWeek(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Ce que fait l'employé ce jour-là : absent (avec l'absence), en poste (avec sa journée), ou en repos. */
export function memberDay(
  member: Pick<TeamMember, "schedule" | "absences">,
  date: string,
): { kind: "absent"; absence: Absence } | { kind: "working"; day: DaySchedule } | { kind: "off" } {
  const absence = member.absences.find((a) => a.startDate <= date && date <= a.endDate);
  if (absence) return { kind: "absent", absence };
  const day = member.schedule.find((d) => d.dayOfWeek === isoDayOfWeek(date));
  return day ? { kind: "working", day } : { kind: "off" };
}

