import type { Garage } from "../entities/garage";
import type { GarageFilter, IGarageRepository } from "../repositories/IGarageRepository";

export class GetGarages {
  constructor(private readonly repository: IGarageRepository) {}

  execute(filter?: GarageFilter): Promise<Garage[]> {
    return this.repository.getGarages(filter);
  }
}
