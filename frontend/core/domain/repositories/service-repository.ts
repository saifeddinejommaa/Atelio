import type { Service } from "../entities/service";

export interface ServiceRepository {
  /** Prestations actives de la marque. */
  getServices(): Promise<Service[]>;
}
