import { ServiceApiRepository, StatusApiRepository, type ApiClient } from '@atelio/core/data'
import {
  GetAppointmentStatuses,
  GetInterventionStatuses,
  GetServices,
  type AppointmentStatus,
  type InterventionStatus,
  type Service,
  type StatusOption,
} from '@atelio/core/domain'

export type AppointmentsData = {
  /** Prestations de la marque (le panneau ne propose que celles du garage). */
  services: Service[]
  /** Tables de statuts, pour la légende du calendrier. */
  appointmentStatuses: StatusOption<AppointmentStatus>[]
  interventionStatuses: StatusOption<InterventionStatus>[]
}

export function appointmentsLoader(api: ApiClient) {
  return async (): Promise<AppointmentsData> => {
    const statuses = new StatusApiRepository(api)
    const [services, appointmentStatuses, interventionStatuses] = await Promise.all([
      new GetServices(new ServiceApiRepository(api)).execute(),
      new GetAppointmentStatuses(statuses).execute(),
      new GetInterventionStatuses(statuses).execute(),
    ])
    return { services, appointmentStatuses, interventionStatuses }
  }
}
