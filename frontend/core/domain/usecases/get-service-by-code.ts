import type { Service } from "../entities/service";
import type { ServiceRepository } from "../repositories/service-repository";

export class GetServiceByCode {
  constructor(private readonly repository: ServiceRepository) {}

  async execute(code: string): Promise<Service | undefined> {
    return (await this.repository.getServices()).find((s) => s.code === code);
  }
}
