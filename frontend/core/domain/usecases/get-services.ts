import type { Service } from "../entities/service";
import type { ServiceRepository } from "../repositories/service-repository";

export class GetServices {
  constructor(private readonly repository: ServiceRepository) {}

  execute(): Promise<Service[]> {
    return this.repository.getServices();
  }
}
