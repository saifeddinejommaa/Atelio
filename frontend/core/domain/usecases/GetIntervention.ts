import type { Intervention, InterventionFilter, InterventionSummary, ServiceCategory, SparePartInput } from "../entities/intervention";
import type { Page } from "../entities/page";
import { ValidationError } from "../errors";
import type { IInterventionRepository } from "../repositories/IInterventionRepository";

export class GetIntervention {
  constructor(private readonly repository: IInterventionRepository) {}

  execute(id: number): Promise<Intervention | null> {
    return this.repository.getById(id);
  }
}

/** Change le mécanicien chargé de l'intervention (mécanicien actif du même garage, vérifié par l'API). */
export class AssignInterventionEmployee {
  constructor(private readonly repository: IInterventionRepository) {}

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
  constructor(private readonly repository: IInterventionRepository) {}

  async execute(interventionId: number, part: SparePartInput): Promise<number> {
    return this.repository.addSparePart(interventionId, checkPart(part));
  }
}

export class UpdateSparePart {
  constructor(private readonly repository: IInterventionRepository) {}

  async execute(interventionId: number, sparePartId: number, part: SparePartInput): Promise<void> {
    return this.repository.updateSparePart(interventionId, sparePartId, checkPart(part));
  }
}

export class DeleteSparePart {
  constructor(private readonly repository: IInterventionRepository) {}

  execute(interventionId: number, sparePartId: number): Promise<void> {
    return this.repository.deleteSparePart(interventionId, sparePartId);
  }
}

function checkQuantity(quantity: number): number {
  if (!(quantity > 0)) throw new ValidationError("La quantité doit être supérieure à 0.");
  return quantity;
}

/** Importe un article du catalogue (prix HT copié, non modifiable). */
export class AddInterventionArticle {
  constructor(private readonly repository: IInterventionRepository) {}

  async execute(interventionId: number, articleId: number, quantity: number): Promise<number> {
    return this.repository.addArticle(interventionId, articleId, checkQuantity(quantity));
  }
}

export class UpdateInterventionArticle {
  constructor(private readonly repository: IInterventionRepository) {}

  async execute(interventionId: number, lineId: number, quantity: number): Promise<void> {
    return this.repository.updateArticleQuantity(interventionId, lineId, checkQuantity(quantity));
  }
}

export class DeleteInterventionArticle {
  constructor(private readonly repository: IInterventionRepository) {}

  execute(interventionId: number, lineId: number): Promise<void> {
    return this.repository.deleteArticle(interventionId, lineId);
  }
}

/** Importe un devis du client de l'intervention : ses lignes s'ajoutent aux articles. */
export class ImportQuote {
  constructor(private readonly repository: IInterventionRepository) {}

  execute(interventionId: number, quoteId: number): Promise<void> {
    return this.repository.importQuote(interventionId, quoteId);
  }
}

/** Main-d'œuvre d'une prestation (ex. « Autre ») : temps passé et type indiqués par le mécanicien. */
export class UpdateServiceLabour {
  constructor(private readonly repository: IInterventionRepository) {}

  async execute(interventionId: number, serviceId: number, labourMinutes: number, categoryId: number): Promise<void> {
    if (!Number.isInteger(labourMinutes) || labourMinutes <= 0) throw new ValidationError("Indiquez le temps passé.");
    if (!categoryId) throw new ValidationError("Choisissez le type de prestation.");
    return this.repository.updateServiceLabour(interventionId, serviceId, labourMinutes, categoryId);
  }
}

export class GetServiceCategories {
  constructor(private readonly repository: IInterventionRepository) {}

  execute(): Promise<ServiceCategory[]> {
    return this.repository.getServiceCategories();
  }
}

/** Interventions du garage par pages : filtres client, immatriculation, jour et statut. */
export class GetInterventions {
  constructor(private readonly repository: IInterventionRepository) {}

  execute(filter: InterventionFilter): Promise<Page<InterventionSummary>> {
    return this.repository.getInterventions({
      ...filter,
      customer: filter.customer?.trim() || undefined,
      plate: filter.plate?.trim() || undefined,
      date: filter.date || undefined,
    });
  }
}
