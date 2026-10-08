import type { CustomerVehicle } from "../entities/CustomerVehicle";
import type { IVehicleRepository } from "../repositories/IVehicleRepository";

/** Véhicules actifs d'un client. */
export class GetCustomerVehicles {
  constructor(private readonly repository: IVehicleRepository) {}

  execute(customerId: number): Promise<CustomerVehicle[]> {
    return this.repository.getCustomerVehicles(customerId);
  }
}
