import { StatusApiRepository, type ApiClient } from '@atelio/core/data'
import { GetInterventionStatuses, type InterventionStatus, type StatusOption } from '@atelio/core/domain'

/** Statuts d'intervention (table intervention_status), pour le filtre de la liste. */
export function interventionStatusesLoader(api: ApiClient) {
  return (): Promise<StatusOption<InterventionStatus>[]> => new GetInterventionStatuses(new StatusApiRepository(api)).execute()
}
