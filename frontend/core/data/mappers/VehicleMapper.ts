import type { CustomerVehicle, VehicleCategory, VehicleFuel, VehicleGearbox } from "../../domain";
import type { VehicleDto } from "../dto/VehicleDto";

const fuels: VehicleFuel[] = ["petrol", "diesel", "hybrid_petrol", "hybrid_diesel", "electric", "lpg", "other"];
const gearboxes: VehicleGearbox[] = ["manual", "automatic"];
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
    version: dto.version ?? null,
    year: dto.year,
    firstRegistration: dto.firstRegistration ? dto.firstRegistration.slice(0, 10) : null,
    fuel: oneOf(fuels, dto.fuel),
    gearbox: oneOf(gearboxes, dto.gearbox ?? null),
    weightKg: dto.weightKg ?? null,
    category: oneOf(categories, dto.category),
    mileage: dto.mileage,
    missingDetails: dto.missingDetails ?? [],
  };
}
