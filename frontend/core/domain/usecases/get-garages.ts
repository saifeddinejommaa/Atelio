import type { Garage } from "../entities/garage";
import type { GarageFilter, GarageRepository } from "../repositories/garage-repository";

export class GetGarages {
  constructor(private readonly repository: GarageRepository) {}

  execute(filter?: GarageFilter): Promise<Garage[]> {
    return this.repository.getGarages(filter);
  }
}
