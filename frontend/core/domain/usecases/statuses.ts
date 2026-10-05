import type { AppointmentStatus, InterventionStatus, StatusOption } from "../entities/status";
import type { StatusRepository } from "../repositories/status-repository";

export class GetAppointmentStatuses {
  constructor(private readonly repository: StatusRepository) {}

  execute(): Promise<StatusOption<AppointmentStatus>[]> {
    return this.repository.getAppointmentStatuses();
  }
}

export class GetInterventionStatuses {
  constructor(private readonly repository: StatusRepository) {}

  execute(): Promise<StatusOption<InterventionStatus>[]> {
    return this.repository.getInterventionStatuses();
  }
}
