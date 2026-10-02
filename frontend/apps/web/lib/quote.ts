import type { Service } from "@/lib/services";

// Catégories de véhicule : le prix « à partir de » s'applique aux citadines,
// les autres catégories ont un coefficient (pièces plus chères, plus de main-d'œuvre).
export const vehicleCategories = [
  { id: "citadine", label: "Citadine", factor: 1 },
  { id: "compacte", label: "Compacte / berline", factor: 1.15 },
  { id: "suv", label: "SUV / monospace", factor: 1.3 },
  { id: "utilitaire", label: "Utilitaire", factor: 1.4 },
] as const;

export type CategoryId = (typeof vehicleCategories)[number]["id"];

export type Vehicle = { make: string; model: string; year: number; fuel: string; category: CategoryId };

// Base fictive en attendant un vrai service d'identification par immatriculation (via l'API .NET).
const catalog: Omit<Vehicle, "year">[] = [
  { make: "Renault", model: "Clio V", fuel: "Essence", category: "citadine" },
  { make: "Peugeot", model: "208", fuel: "Essence", category: "citadine" },
  { make: "Peugeot", model: "308", fuel: "Diesel", category: "compacte" },
  { make: "Volkswagen", model: "Golf 8", fuel: "Essence", category: "compacte" },
  { make: "Citroën", model: "C5 Aircross", fuel: "Hybride", category: "suv" },
  { make: "Dacia", model: "Duster", fuel: "Diesel", category: "suv" },
  { make: "Renault", model: "Trafic", fuel: "Diesel", category: "utilitaire" },
];

export const PLATE_PATTERN = /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/i;

export function formatPlate(plate: string): string {
  const raw = plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return raw.length === 7 ? `${raw.slice(0, 2)}-${raw.slice(2, 5)}-${raw.slice(5)}` : plate.toUpperCase();
}

/** Identifie (de façon simulée mais stable) le véhicule correspondant à une immatriculation. */
export function lookupVehicle(plate: string): Vehicle | null {
  if (!PLATE_PATTERN.test(plate.trim())) return null;
  const key = formatPlate(plate);
  const hash = [...key].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const base = catalog[hash % catalog.length];
  return { ...base, year: 2012 + (hash % 12) };
}

export type QuoteLine = { service: Service; parts: number; labour: number; total: number };

export function computeQuote(services: Service[], category: CategoryId) {
  const factor = vehicleCategories.find((c) => c.id === category)?.factor ?? 1;
  const lines: QuoteLine[] = services.map((service) => {
    const total = Math.round(service.priceFrom * factor);
    const parts = Math.round(total * 0.6);
    return { service, parts, labour: total - parts, total };
  });
  const totalTTC = lines.reduce((sum, l) => sum + l.total, 0);
  const totalHT = Math.round((totalTTC / 1.2) * 100) / 100;
  return { lines, totalTTC, totalHT, vat: Math.round((totalTTC - totalHT) * 100) / 100 };
}
