import type { AppointmentStatus, InterventionStatus, StatusOption } from "../entities/status";
import type { IStatusRepository } from "../repositories/IStatusRepository";

export class GetAppointmentStatuses {
  constructor(private readonly repository: IStatusRepository) {}

  execute(): Promise<StatusOption<AppointmentStatus>[]> {
    return this.repository.getAppointmentStatuses();
  }
}

export class GetInterventionStatuses {
  constructor(private readonly repository: IStatusRepository) {}

  execute(): Promise<StatusOption<InterventionStatus>[]> {
    return this.repository.getInterventionStatuses();
  }
}
