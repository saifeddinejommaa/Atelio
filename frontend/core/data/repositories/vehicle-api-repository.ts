import type { CustomerVehicle, VehicleRepository } from "../../domain";
import type { ApiClient } from "../http/api-client";
import type { VehicleDto } from "../dto/vehicle-dto";
import { toCustomerVehicle } from "../mappers/vehicle-mapper";

export class VehicleApiRepository implements VehicleRepository {
  constructor(private readonly api: ApiClient) {}

  async getCustomerVehicles(customerId: number): Promise<CustomerVehicle[]> {
    const vehicles = await this.api.get<VehicleDto[]>(`/customers/${customerId}/vehicles`);
    return (vehicles ?? []).map(toCustomerVehicle);
  }
}
