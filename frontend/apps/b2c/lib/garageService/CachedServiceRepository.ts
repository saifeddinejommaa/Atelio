import { cache } from "react";
import { ServiceApiRepository } from "@atelio/core/data";
import type { Service, IServiceRepository } from "@atelio/core/domain";
import { apiClient } from "@/lib/api";

// Un seul appel à l'API par marque et par requête : le layout et la page partagent le résultat.
const fetchServices = cache((apiTenant: string): Promise<Service[]> =>
  new ServiceApiRepository(apiClient(apiTenant)).getServices(),
);

export class CachedServiceRepository implements IServiceRepository {
  constructor(private readonly apiTenant: string) {}

  getServices(): Promise<Service[]> {
    return fetchServices(this.apiTenant);
  }
}
