import type { Service } from "../entities/service";
import type { IServiceRepository } from "../repositories/IServiceRepository";

export class GetServices {
  constructor(private readonly repository: IServiceRepository) {}

  execute(): Promise<Service[]> {
    return this.repository.getServices();
  }
}
