import { InterventionApiRepository, ManagedServiceApiRepository, type ApiClient } from '@atelio/core/data'
import { GetManagedServices, GetServiceCategories, type ManagedService, type ServiceCategory } from '@atelio/core/domain'

export type ServicesData = {
  /** Toutes les prestations : la page filtre elle-même. */
  services: ManagedService[]
  /** Types d'intervention (taux horaire de main-d'œuvre). */
  categories: ServiceCategory[]
}

export function servicesLoader(api: ApiClient) {
  return async (): Promise<ServicesData> => {
    const [services, categories] = await Promise.all([
      new GetManagedServices(new ManagedServiceApiRepository(api)).execute(),
      new GetServiceCategories(new InterventionApiRepository(api)).execute(),
    ])
    return { services, categories }
  }
}
