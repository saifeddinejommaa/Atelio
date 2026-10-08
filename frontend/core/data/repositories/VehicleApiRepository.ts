import type { CustomerVehicle, IVehicleRepository } from "../../domain";
import type { ApiClient } from "../http/ApiClient";
import type { VehicleDto } from "../dto/VehicleDto";
import { toCustomerVehicle } from "../mappers/VehicleMapper";

export class VehicleApiRepository implements IVehicleRepository {
  constructor(private readonly api: ApiClient) {}

  async getCustomerVehicles(customerId: number): Promise<CustomerVehicle[]> {
    const vehicles = await this.api.get<VehicleDto[]>(`/customers/${customerId}/vehicles`);
    return (vehicles ?? []).map(toCustomerVehicle);
  }
}
