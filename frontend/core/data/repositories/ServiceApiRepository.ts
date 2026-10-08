import type { Service, IServiceRepository } from "../../domain";
import type { ApiClient } from "../http/ApiClient";
import type { ServiceDto } from "../dto/ServiceDto";
import { toServiceEntity } from "../mappers/ServiceMapper";

export class ServiceApiRepository implements IServiceRepository {
  constructor(private readonly api: ApiClient) {}

  async getServices(): Promise<Service[]> {
    const services = await this.api.get<ServiceDto[]>("/services");
    return (services ?? []).map(toServiceEntity);
  }
}
