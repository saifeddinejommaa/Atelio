import type { VehicleCategory } from "./vehicle";

export type VehicleFuel = "petrol" | "diesel" | "hybrid" | "electric" | "lpg" | "other";

/** Véhicule enregistré par un client. Les caractéristiques sont facultatives. */
export type CustomerVehicle = {
  id: number;
  customerId: number;
  /** "AB-123-CD" */
  plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  fuel: VehicleFuel | null;
  category: VehicleCategory | null;
  mileage: number | null;
};
