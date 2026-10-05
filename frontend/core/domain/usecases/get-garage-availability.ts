import type { DayAvailability } from "../entities/garage";
import { ValidationError } from "../errors";
import type { AvailabilityQuery, GarageRepository } from "../repositories/garage-repository";

/** Créneaux d'un garage, jour par jour, pour la durée totale des prestations demandées. */
export class GetGarageAvailability {
  constructor(private readonly repository: GarageRepository) {}

  async execute(query: AvailabilityQuery): Promise<DayAvailability[]> {
    if (query.serviceIds.length === 0) throw new ValidationError("Choisissez au moins une prestation.");
    return this.repository.getAvailability(query);
  }
}
