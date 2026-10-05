import type { VehicleCategory } from "../entities/vehicle";

// Le prix « à partir de » s'applique aux citadines. Les autres catégories ont un coefficient
// (pièces plus chères, plus de main-d'œuvre).
export const vehicleCategories: readonly { id: VehicleCategory; label: string; factor: number }[] = [
  { id: "city", label: "Citadine", factor: 1 },
  { id: "compact", label: "Compacte / berline", factor: 1.15 },
  { id: "suv", label: "SUV / monospace", factor: 1.3 },
  { id: "utility", label: "Utilitaire", factor: 1.4 },
];

export type QuoteLine<S> = { service: S; parts: number; labour: number; total: number };

export type Quote<S> = { lines: QuoteLine<S>[]; totalTTC: number; totalHT: number; vat: number };

/** Devis TTC des prestations pour une catégorie de véhicule. `priceOf` donne le prix « à partir de » TTC. */
export function computeQuote<S>(services: S[], category: VehicleCategory, priceOf: (service: S) => number): Quote<S> {
  const factor = vehicleCategories.find((c) => c.id === category)?.factor ?? 1;
  const lines = services.map((service) => {
    const total = Math.round(priceOf(service) * factor);
    const parts = Math.round(total * 0.6);
    return { service, parts, labour: total - parts, total };
  });
  const totalTTC = lines.reduce((sum, l) => sum + l.total, 0);
  const totalHT = Math.round((totalTTC / 1.2) * 100) / 100;
  return { lines, totalTTC, totalHT, vat: Math.round((totalTTC - totalHT) * 100) / 100 };
}
