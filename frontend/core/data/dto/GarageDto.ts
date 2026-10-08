/** Garage tel que renvoyé par GET /api/garages. */
export type GarageDto = {
  id: number;
  name: string;
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  openingTime: string;
  closingTime: string;
  openDays: number[];
  serviceCodes: string[];
};

/** Jour de GET /api/garages/{id}/availability. */
export type DayAvailabilityDto = {
  date: string;
  slots: { time: string; available: boolean }[];
};

/** Période de GET /api/garages/{id}/capacity (UTC). */
export type CapacityPeriodDto = { start: string; end: string; free: number; total: number };

/** Réponse de GET /api/garages/{id}/slot-check. */
export type SlotCheckDto = {
  available: boolean;
  message: string | null;
  durationMinutes: number;
  estimatedEndAt: string | null;
  warning: string | null;
};

/** Mécanicien de GET /api/garages/{id}/mechanics. */
export type MechanicDto = { id: number; firstName: string; lastName: string };
