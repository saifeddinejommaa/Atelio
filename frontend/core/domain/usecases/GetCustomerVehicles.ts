import type { CustomerVehicle, VehicleDetails } from "../entities/CustomerVehicle";
import { ValidationError } from "../errors";
import type { IVehicleRepository } from "../repositories/IVehicleRepository";

/** Véhicules actifs d'un client. */
export class GetCustomerVehicles {
  constructor(private readonly repository: IVehicleRepository) {}

  execute(customerId: number): Promise<CustomerVehicle[]> {
    return this.repository.getCustomerVehicles(customerId);
  }
}

export class GetVehicle {
  constructor(private readonly repository: IVehicleRepository) {}

  execute(vehicleId: number): Promise<CustomerVehicle | null> {
    return this.repository.getById(vehicleId);
  }
}

/** Enregistre les informations du véhicule (toutes obligatoires avant l'entrée en atelier). */
export class UpdateVehicleDetails {
  constructor(private readonly repository: IVehicleRepository) {}

  async execute(vehicleId: number, details: VehicleDetails): Promise<void> {
    const make = details.make.trim();
    const model = details.model.trim();
    const version = details.version.trim();
    if (!make) throw new ValidationError("Indiquez la marque.");
    if (!model) throw new ValidationError("Indiquez le modèle.");
    if (!version) throw new ValidationError("Indiquez la version.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.firstRegistration)) throw new ValidationError("Indiquez la date de 1re mise en circulation.");
    if (new Date(details.firstRegistration) > new Date()) throw new ValidationError("La date de 1re mise en circulation est dans le futur.");
    if (!details.fuel) throw new ValidationError("Choisissez l'énergie.");
    if (!details.gearbox) throw new ValidationError("Choisissez la boîte de vitesses.");
    if (details.weightKg !== null && !(Number.isInteger(details.weightKg) && details.weightKg >= 100 && details.weightKg <= 60000))
      throw new ValidationError("Poids invalide (en kg).");
    return this.repository.updateDetails(vehicleId, { ...details, make, model, version });
  }
}
