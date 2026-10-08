import type { CustomerVehicle, VehicleCategory, VehicleFuel } from "../../domain";
import type { VehicleDto } from "../dto/VehicleDto";

const fuels: VehicleFuel[] = ["petrol", "diesel", "hybrid", "electric", "lpg", "other"];
const categories: VehicleCategory[] = ["city", "compact", "suv", "utility"];

function oneOf<T extends string>(values: T[], value: string | null): T | null {
  const v = value?.toLowerCase() as T | undefined;
  return v && values.includes(v) ? v : null;
}

export function toCustomerVehicle(dto: VehicleDto): CustomerVehicle {
  return {
    id: dto.id,
    customerId: dto.customerId,
    plate: dto.plate,
    make: dto.make,
    model: dto.model,
    year: dto.year,
    fuel: oneOf(fuels, dto.fuel),
    category: oneOf(categories, dto.category),
    mileage: dto.mileage,
  };
}
