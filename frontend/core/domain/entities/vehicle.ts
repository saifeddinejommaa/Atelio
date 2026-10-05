export type VehicleCategory = "city" | "compact" | "suv" | "utility";

/** Véhicule identifié par son immatriculation. */
export type Vehicle = {
  make: string;
  model: string;
  year: number;
  fuel: string;
  category: VehicleCategory;
};
