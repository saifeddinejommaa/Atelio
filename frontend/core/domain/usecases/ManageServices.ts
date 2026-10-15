import type { ManagedService, ServiceInput } from "../entities/service";
import { ValidationError } from "../errors";
import type { IManagedServiceRepository } from "../repositories/IManagedServiceRepository";

/** Vérifie une prestation saisie et la nettoie (description facultative). */
function checkService(service: ServiceInput): ServiceInput {
  const name = service.name.trim();
  if (!name) throw new ValidationError("Indiquez le nom de la prestation.");
  if (!(service.price >= 0)) throw new ValidationError("Indiquez un prix valide.");
  if (!(Number.isInteger(service.durationMinutes) && service.durationMinutes > 0)) {
    throw new ValidationError("Indiquez une durée en minutes supérieure à 0.");
  }
  return { ...service, name, description: service.description?.trim() || null };
}

/** Toutes les prestations (back-office). */
export class GetManagedServices {
  constructor(private readonly repository: IManagedServiceRepository) {}

  execute(): Promise<ManagedService[]> {
    return this.repository.getAll();
  }
}

export class CreateService {
  constructor(private readonly repository: IManagedServiceRepository) {}

  async execute(service: ServiceInput): Promise<number> {
    return this.repository.create(checkService(service));
  }
}

/** Modifie une prestation : les rendez-vous et interventions déjà enregistrés gardent leur prix. */
export class UpdateService {
  constructor(private readonly repository: IManagedServiceRepository) {}

  async execute(serviceId: number, service: ServiceInput): Promise<void> {
    return this.repository.update(serviceId, checkService(service));
  }
}

/** Désactive (plus proposée sur le site) ou réactive une prestation. */
export class SetServiceActive {
  constructor(private readonly repository: IManagedServiceRepository) {}

  execute(serviceId: number, isActive: boolean): Promise<void> {
    return this.repository.setActive(serviceId, isActive);
  }
}

/** Supprime une prestation jamais utilisée. */
export class DeleteService {
  constructor(private readonly repository: IManagedServiceRepository) {}

  execute(serviceId: number): Promise<void> {
    return this.repository.delete(serviceId);
  }
}
