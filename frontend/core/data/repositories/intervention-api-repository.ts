import type {
  Intervention,
  InterventionFilter,
  InterventionRepository,
  InterventionSummary,
  ServiceCategory,
  SparePartInput,
} from "../../domain";
import { ApiError, type ApiClient } from "../http/api-client";
import type { InterventionDto, InterventionSummaryDto } from "../dto/intervention-dto";
import { toInterventionEntity, toInterventionSummary } from "../mappers/intervention-mapper";

export class InterventionApiRepository implements InterventionRepository {
  constructor(private readonly api: ApiClient) {}

  async getInterventions(filter: InterventionFilter): Promise<InterventionSummary[]> {
    const list = await this.api.get<InterventionSummaryDto[]>("/interventions", {
      garageId: filter.garageId,
      status: filter.stage,
      search: filter.search,
    });
    return (list ?? []).map(toInterventionSummary);
  }

  async getById(id: number): Promise<Intervention | null> {
    const intervention = await this.api.get<InterventionDto>(`/interventions/${id}`);
    return intervention && toInterventionEntity(intervention);
  }

  async assignEmployee(interventionId: number, employeeId: number): Promise<void> {
    await this.api.put(`/interventions/${interventionId}/employee`, { employeeId });
  }

  async updateServiceLabour(interventionId: number, serviceId: number, labourMinutes: number, categoryId: number): Promise<void> {
    await this.api.put(`/interventions/${interventionId}/services/${serviceId}`, { labourMinutes, categoryId });
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    const categories = await this.api.get<ServiceCategory[]>("/service-categories");
    return (categories ?? []).map((c) => ({ id: c.id, code: c.code, name: c.name, hourlyRate: c.hourlyRate }));
  }

  async addSparePart(interventionId: number, part: SparePartInput): Promise<number> {
    const created = await this.api.post<{ id: number }>(`/interventions/${interventionId}/spare-parts`, part);
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé la pièce ajoutée.");
    return created.id;
  }

  async updateSparePart(interventionId: number, sparePartId: number, part: SparePartInput): Promise<void> {
    await this.api.put(`/interventions/${interventionId}/spare-parts/${sparePartId}`, part);
  }

  async deleteSparePart(interventionId: number, sparePartId: number): Promise<void> {
    await this.api.delete(`/interventions/${interventionId}/spare-parts/${sparePartId}`);
  }
}
