import type { ManagedService, ServiceInput } from "../entities/service";

/** Gestion des prestations de la marque (back-office). */
export interface IManagedServiceRepository {
  /** Toutes les prestations, actives ou non. */
  getAll(): Promise<ManagedService[]>;
  /** Ajoute une prestation (active, dans tous les garages) et renvoie son identifiant. */
  create(service: ServiceInput): Promise<number>;
  update(serviceId: number, service: ServiceInput): Promise<void>;
  setActive(serviceId: number, isActive: boolean): Promise<void>;
  /** Refusé si la prestation est déjà utilisée (rendez-vous, interventions, promotions). */
  delete(serviceId: number): Promise<void>;
}
