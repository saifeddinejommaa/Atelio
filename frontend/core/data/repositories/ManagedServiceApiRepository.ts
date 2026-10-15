import type { IManagedServiceRepository, ManagedService, ServiceInput } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";
import type { ServiceDto } from "../dto/ServiceDto";
import { toServiceEntity } from "../mappers/ServiceMapper";

/** Élément de GET /api/services/all. */
export type ManagedServiceDto = ServiceDto & { isActive: boolean; categoryId: number | null; categoryName: string | null };

export class ManagedServiceApiRepository implements IManagedServiceRepository {
  constructor(private readonly api: ApiClient) {}

  async getAll(): Promise<ManagedService[]> {
    const services = await this.api.get<ManagedServiceDto[]>("/services/all");
    return (services ?? []).map((s) => ({
      ...toServiceEntity(s),
      isActive: s.isActive,
      categoryId: s.categoryId ?? null,
      categoryName: s.categoryName ?? null,
    }));
  }

  async create(service: ServiceInput): Promise<number> {
    const created = await this.api.post<{ id: number }>("/services", service);
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé la prestation ajoutée.");
    return created.id;
  }

  async update(serviceId: number, service: ServiceInput): Promise<void> {
    await this.api.put(`/services/${serviceId}`, service);
  }

  async setActive(serviceId: number, isActive: boolean): Promise<void> {
    await this.api.put(`/services/${serviceId}/active`, { isActive });
  }

  async delete(serviceId: number): Promise<void> {
    await this.api.delete(`/services/${serviceId}`);
  }
}
