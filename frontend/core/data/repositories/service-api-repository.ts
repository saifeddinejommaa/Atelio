import type { Service, ServiceRepository } from "../../domain";
import type { ApiClient } from "../http/api-client";
import type { ServiceDto } from "../dto/service-dto";
import { toServiceEntity } from "../mappers/service-mapper";

export class ServiceApiRepository implements ServiceRepository {
  constructor(private readonly api: ApiClient) {}

  async getServices(): Promise<Service[]> {
    const services = await this.api.get<ServiceDto[]>("/services");
    return (services ?? []).map(toServiceEntity);
  }
}
