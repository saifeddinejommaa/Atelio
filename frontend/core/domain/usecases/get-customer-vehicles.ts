import type { CustomerVehicle } from "../entities/customer-vehicle";
import type { VehicleRepository } from "../repositories/vehicle-repository";

/** Véhicules actifs d'un client. */
export class GetCustomerVehicles {
  constructor(private readonly repository: VehicleRepository) {}

  execute(customerId: number): Promise<CustomerVehicle[]> {
    return this.repository.getCustomerVehicles(customerId);
  }
}
