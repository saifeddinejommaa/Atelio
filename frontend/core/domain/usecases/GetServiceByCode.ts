import type { Service } from "../entities/service";
import type { IServiceRepository } from "../repositories/IServiceRepository";

export class GetServiceByCode {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(code: string): Promise<Service | undefined> {
    return (await this.repository.getServices()).find((s) => s.code === code);
  }
}
