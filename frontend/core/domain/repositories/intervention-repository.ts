import type { Intervention, InterventionFilter, InterventionSummary, ServiceCategory, SparePartInput } from "../entities/intervention";

export interface InterventionRepository {
  getById(id: number): Promise<Intervention | null>;
  /** Interventions filtrées, des plus récentes aux plus anciennes. */
  getInterventions(filter: InterventionFilter): Promise<InterventionSummary[]>;
  /** Change le mécanicien chargé de l'intervention. */
  assignEmployee(interventionId: number, employeeId: number): Promise<void>;
  /** Temps passé et catégorie d'une prestation ; son prix devient taux × temps. */
  updateServiceLabour(interventionId: number, serviceId: number, labourMinutes: number, categoryId: number): Promise<void>;
  /** Ajoute une pièce et renvoie son identifiant. */
  addSparePart(interventionId: number, part: SparePartInput): Promise<number>;
  updateSparePart(interventionId: number, sparePartId: number, part: SparePartInput): Promise<void>;
  deleteSparePart(interventionId: number, sparePartId: number): Promise<void>;
  /** Catégories de prestations avec leur taux horaire. */
  getServiceCategories(): Promise<ServiceCategory[]>;
}
