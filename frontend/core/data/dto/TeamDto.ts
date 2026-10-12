/** Journée type de GET /api/garages/{id}/team (heures "08:30"). */
export type DayScheduleDto = {
  dayOfWeek: number;
  start: string;
  end: string;
  breakStart: string | null;
  breakEnd: string | null;
};

/** Absence en jours entiers ("2026-10-12"). */
export type AbsenceDto = {
  id: number;
  startDate: string;
  endDate: string;
  /** leave, sick, training, other */
  reason: string;
  comment: string | null;
};

/** Employé de GET /api/garages/{id}/team. */
export type TeamMemberDto = {
  id: number;
  firstName: string;
  lastName: string;
  /** mechanic, manager, reception */
  role: string;
  phone: string | null;
  email: string | null;
  schedule: DayScheduleDto[];
  absences: AbsenceDto[];
};
