import { formatPlate, isValidPlate, type Vehicle } from "../../domain";

// Base fictive en attendant un vrai service d'identification par immatriculation (via l'API .NET).
const catalog: Omit<Vehicle, "year">[] = [
  { make: "Renault", model: "Clio V", fuel: "Essence", category: "city" },
  { make: "Peugeot", model: "208", fuel: "Essence", category: "city" },
  { make: "Peugeot", model: "308", fuel: "Diesel", category: "compact" },
  { make: "Volkswagen", model: "Golf 8", fuel: "Essence", category: "compact" },
  { make: "Citroën", model: "C5 Aircross", fuel: "Hybride", category: "suv" },
  { make: "Dacia", model: "Duster", fuel: "Diesel", category: "suv" },
  { make: "Renault", model: "Trafic", fuel: "Diesel", category: "utility" },
];

/** Identifie (de façon simulée mais stable) le véhicule correspondant à une immatriculation. */
export function lookupVehicle(plate: string): Vehicle | null {
  if (!isValidPlate(plate)) return null;
  const key = formatPlate(plate);
  const hash = [...key].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const base = catalog[hash % catalog.length];
  return { ...base, year: 2012 + (hash % 12) };
}
