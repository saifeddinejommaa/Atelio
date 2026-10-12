import { lookupVehicle } from "@atelio/core/data";
import type { CustomerVehicle, VehicleCategory } from "@atelio/core/domain";

/** Véhicule du client tel qu'affiché dans la prise de rendez-vous. */
export type Vehicle = {
  id: number;
  plate: string;
  /** Marque et modèle, ex. "Peugeot 308" (null si inconnus). */
  label: string | null;
  /** Catégorie pour le prix (null si inconnue : prix « à partir de »). */
  category: VehicleCategory | null;
  /** Dernier kilométrage connu. */
  mileage: number | null;
};

/** Les caractéristiques manquantes sont complétées par l'identification par immatriculation. */
export function toVehicle(entity: CustomerVehicle): Vehicle {
  const identified = entity.make && entity.model ? null : lookupVehicle(entity.plate);
  const make = entity.make ?? identified?.make;
  const model = entity.model ?? identified?.model;
  return {
    id: entity.id,
    plate: entity.plate,
    label: make && model ? `${make} ${model}` : null,
    category: entity.category ?? identified?.category ?? null,
    mileage: entity.mileage,
  };
}
