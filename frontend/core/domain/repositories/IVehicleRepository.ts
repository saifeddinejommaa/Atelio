import type { CustomerVehicle, VehicleDetails } from "../entities/CustomerVehicle";

export interface IVehicleRepository {
  getCustomerVehicles(customerId: number): Promise<CustomerVehicle[]>;
  getById(vehicleId: number): Promise<CustomerVehicle | null>;
  /** Informations saisies par le garage avant l'entrée en atelier. */
  updateDetails(vehicleId: number, details: VehicleDetails): Promise<void>;
}
