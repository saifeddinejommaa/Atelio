import { ServiceApiRepository, type ApiClient } from '@atelio/core/data'
import { GetServices, type Service } from '@atelio/core/domain'

/** Prestations de la marque (le panneau ne propose que celles du garage). */
export function servicesLoader(api: ApiClient) {
  return (): Promise<Service[]> => new GetServices(new ServiceApiRepository(api)).execute()
}
