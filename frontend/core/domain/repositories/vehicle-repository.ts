import type { CustomerVehicle } from "../entities/customer-vehicle";

export interface VehicleRepository {
  getCustomerVehicles(customerId: number): Promise<CustomerVehicle[]>;
}
