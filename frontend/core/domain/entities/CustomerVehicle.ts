import type { VehicleCategory } from "./vehicle";

export type VehicleFuel = "petrol" | "diesel" | "hybrid_petrol" | "hybrid_diesel" | "electric" | "lpg" | "other";

export type VehicleGearbox = "manual" | "automatic";

export const fuelLabels: Record<VehicleFuel, string> = {
  petrol: "Essence",
  diesel: "Diesel",
  hybrid_petrol: "Hybride essence",
  hybrid_diesel: "Hybride diesel",
  electric: "Électrique",
  lpg: "GPL",
  other: "Autre",
};

export const gearboxLabels: Record<VehicleGearbox, string> = {
  manual: "Manuelle",
  automatic: "Automatique",
};

/** Véhicule enregistré par un client. Les caractéristiques sont facultatives. */
export type CustomerVehicle = {
  id: number;
  customerId: number;
  /** "AB-123-CD" */
  plate: string;
  make: string | null;
  model: string | null;
  /** Finition / motorisation (ex. « SW 1.6 HDi »). */
  version: string | null;
  year: number | null;
  /** Date de 1re mise en circulation, "2009-05-12". */
  firstRegistration: string | null;
  fuel: VehicleFuel | null;
  gearbox: VehicleGearbox | null;
  /** Poids en kg (carte grise, case G.1). */
  weightKg: number | null;
  category: VehicleCategory | null;
  mileage: number | null;
  /** Informations à saisir avant l'entrée en atelier (vide : complet), calculées par l'API. */
  missingDetails: string[];
};

/** Informations saisies par le garage avant l'entrée en atelier (toutes obligatoires sauf le poids). */
export type VehicleDetails = {
  make: string;
  model: string;
  version: string;
  /** "2009-05-12" */
  firstRegistration: string;
  fuel: VehicleFuel;
  gearbox: VehicleGearbox;
  /** Poids en kg, facultatif. */
  weightKg: number | null;
};
