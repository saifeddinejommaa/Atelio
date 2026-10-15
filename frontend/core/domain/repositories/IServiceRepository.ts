import type { Service } from "../entities/service";

export interface IServiceRepository {
  /** Prestations actives de la marque. */
  getServices(): Promise<Service[]>;
}
