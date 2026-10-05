import type { Intervention, InterventionFilter, InterventionSummary, ServiceCategory, SparePartInput } from "../entities/intervention";
import { ValidationError } from "../errors";
import type { InterventionRepository } from "../repositories/intervention-repository";

export class GetIntervention {
  constructor(private readonly repository: InterventionRepository) {}

  execute(id: number): Promise<Intervention | null> {
    return this.repository.getById(id);
  }
}

/** Change le mécanicien chargé de l'intervention (mécanicien actif du même garage, vérifié par l'API). */
export class AssignInterventionEmployee {
  constructor(private readonly repository: InterventionRepository) {}

  execute(interventionId: number, employeeId: number): Promise<void> {
    return this.repository.assignEmployee(interventionId, employeeId);
  }
}

/** Vérifie une pièce saisie et la nettoie (référence facultative, prix TTC). */
function checkPart(part: SparePartInput): SparePartInput {
  const name = part.name.trim();
  if (!name) throw new ValidationError("Indiquez la désignation de la pièce.");
  if (!(part.quantity > 0)) throw new ValidationError("La quantité doit être supérieure à 0.");
  if (!(part.unitPrice >= 0)) throw new ValidationError("Indiquez un prix valide.");
  return { reference: part.reference?.trim() || null, name, quantity: part.quantity, unitPrice: part.unitPrice };
}

export class AddSparePart {
  constructor(private readonly repository: InterventionRepository) {}

  async execute(interventionId: number, part: SparePartInput): Promise<number> {
    return this.repository.addSparePart(interventionId, checkPart(part));
  }
}

export class UpdateSparePart {
  constructor(private readonly repository: InterventionRepository) {}

  async execute(interventionId: number, sparePartId: number, part: SparePartInput): Promise<void> {
    return this.repository.updateSparePart(interventionId, sparePartId, checkPart(part));
  }
}

export class DeleteSparePart {
  constructor(private readonly repository: InterventionRepository) {}

  execute(interventionId: number, sparePartId: number): Promise<void> {
    return this.repository.deleteSparePart(interventionId, sparePartId);
  }
}

/** Main-d'œuvre d'une prestation (ex. « Autre ») : temps passé et type indiqués par le mécanicien. */
export class UpdateServiceLabour {
  constructor(private readonly repository: InterventionRepository) {}

  async execute(interventionId: number, serviceId: number, labourMinutes: number, categoryId: number): Promise<void> {
    if (!Number.isInteger(labourMinutes) || labourMinutes <= 0) throw new ValidationError("Indiquez le temps passé.");
    if (!categoryId) throw new ValidationError("Choisissez le type de prestation.");
    return this.repository.updateServiceLabour(interventionId, serviceId, labourMinutes, categoryId);
  }
}

export class GetServiceCategories {
  constructor(private readonly repository: InterventionRepository) {}

  execute(): Promise<ServiceCategory[]> {
    return this.repository.getServiceCategories();
  }
}

/** Interventions du garage : recherche par référence ou client, filtre par statut. */
export class GetInterventions {
  constructor(private readonly repository: InterventionRepository) {}

  execute(filter: InterventionFilter): Promise<InterventionSummary[]> {
    return this.repository.getInterventions({ ...filter, search: filter.search?.trim() || undefined });
  }
}
