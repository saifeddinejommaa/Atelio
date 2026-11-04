import type { CustomerVehicle, VehicleDetails } from "../entities/CustomerVehicle";

export interface IVehicleRepository {
  getCustomerVehicles(customerId: number): Promise<CustomerVehicle[]>;
  getById(vehicleId: number): Promise<CustomerVehicle | null>;
  /** Enregistre le véhicule du client, ou le retrouve s'il a déjà cette immatriculation. */
  save(customerId: number, plate: string): Promise<void>;
  /** Informations saisies par le garage avant l'entrée en atelier. */
  updateDetails(vehicleId: number, details: VehicleDetails): Promise<void>;
}
