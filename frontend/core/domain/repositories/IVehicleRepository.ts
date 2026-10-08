import type { CustomerVehicle } from "../entities/CustomerVehicle";

export interface IVehicleRepository {
  getCustomerVehicles(customerId: number): Promise<CustomerVehicle[]>;
}
