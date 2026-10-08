import type { Intervention, InterventionFilter, InterventionSummary, ServiceCategory, SparePartInput } from "../entities/intervention";
import type { Page } from "../entities/page";

export interface IInterventionRepository {
  getById(id: number): Promise<Intervention | null>;
  /** Page d'interventions filtrées, des plus récentes aux plus anciennes, et leur total. */
  getInterventions(filter: InterventionFilter): Promise<Page<InterventionSummary>>;
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
