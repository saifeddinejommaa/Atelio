import type { CapacityPeriod, Mechanic, SlotCheck } from "../entities/garage";
import type { GarageRepository, SlotCheckQuery } from "../repositories/garage-repository";

/** Places libres du garage par demi-heure d'ouverture (jours inclus, heure locale). */
export class GetGarageCapacity {
  constructor(private readonly repository: GarageRepository) {}

  execute(garageId: number, from: string, to: string): Promise<CapacityPeriod[]> {
    return this.repository.getCapacity(garageId, from, to);
  }
}

/** Un rendez-vous peut-il être placé à cette heure (horaires, passé, mécanicien libre) ? */
export class CheckSlot {
  constructor(private readonly repository: GarageRepository) {}

  async execute(query: SlotCheckQuery): Promise<SlotCheck> {
    const hasDuration = (query.serviceIds?.length ?? 0) > 0 || !!query.excludeAppointment;
    if (!hasDuration) {
      return { available: false, message: "Choisissez au moins une prestation.", durationMinutes: 0, estimatedEndAt: null, warning: null };
    }
    return this.repository.checkSlot(query);
  }
}

/** Mécaniciens actifs du garage (affectation des interventions). */
export class GetGarageMechanics {
  constructor(private readonly repository: GarageRepository) {}

  execute(garageId: number): Promise<Mechanic[]> {
    return this.repository.getMechanics(garageId);
  }
}
