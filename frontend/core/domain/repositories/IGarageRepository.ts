import type { CapacityPeriod, DayAvailability, Garage, Mechanic, SlotCheck } from "../entities/garage";

export type GarageFilter = {
  /** Ville, code postal ou adresse. */
  search?: string;
  /** Uniquement les garages qui réalisent cette prestation. */
  serviceCode?: string;
};

export type AvailabilityQuery = {
  garageId: number;
  serviceIds: number[];
  /** Premier jour, "2026-10-05". Par défaut : demain. */
  from?: string;
  days?: number;
};

export interface IGarageRepository {
  getGarages(filter?: GarageFilter): Promise<Garage[]>;
  getAvailability(query: AvailabilityQuery): Promise<DayAvailability[]>;
  /** Places libres par demi-heure d'ouverture (jours inclus, heure locale). */
  getCapacity(garageId: number, from: string, to: string): Promise<CapacityPeriod[]>;
  checkSlot(query: SlotCheckQuery): Promise<SlotCheck>;
  /** Mécaniciens actifs du garage. */
  getMechanics(garageId: number): Promise<Mechanic[]>;
}

export type SlotCheckQuery = {
  garageId: number;
  /** Heure locale du garage, "2026-10-12T14:00". */
  scheduledAt: string;
  /** Durée : celle de ces prestations... */
  serviceIds?: number[];
  /** ... ou celle du rendez-vous déplacé (non compté comme occupé). */
  excludeAppointment?: string;
};
