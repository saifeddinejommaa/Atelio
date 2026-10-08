import { cache } from "react";
import { GarageApiRepository } from "@atelio/core/data";
import type {
  AvailabilityQuery,
  DayAvailability,
  Garage,
  GarageFilter,
  IGarageRepository,
  Mechanic,
  CapacityPeriod,
  SlotCheck,
  SlotCheckQuery,
} from "@atelio/core/domain";
import { apiClient } from "@/lib/api";

// Un seul appel à l'API par marque, filtre et requête.
const fetchGarages = cache(
  (apiTenant: string, search?: string, serviceCode?: string): Promise<Garage[]> =>
    new GarageApiRepository(apiClient(apiTenant)).getGarages({ search, serviceCode }),
);

export class CachedGarageRepository implements IGarageRepository {
  constructor(private readonly apiTenant: string) {}

  getGarages(filter: GarageFilter = {}): Promise<Garage[]> {
    return fetchGarages(this.apiTenant, filter.search, filter.serviceCode);
  }

  // Les disponibilités changent à chaque réservation : jamais mises en cache.

  getAvailability(query: AvailabilityQuery): Promise<DayAvailability[]> {
    return this.api().getAvailability(query);
  }

  getCapacity(garageId: number, from: string, to: string): Promise<CapacityPeriod[]> {
    return this.api().getCapacity(garageId, from, to);
  }

  checkSlot(query: SlotCheckQuery): Promise<SlotCheck> {
    return this.api().checkSlot(query);
  }

  getMechanics(garageId: number): Promise<Mechanic[]> {
    return this.api().getMechanics(garageId);
  }

  private api(): GarageApiRepository {
    return new GarageApiRepository(apiClient(this.apiTenant));
  }
}
