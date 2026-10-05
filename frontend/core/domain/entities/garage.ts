/** Garage d'une marque. */
export type Garage = {
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
  /** Heure locale d'ouverture, "08:00". */
  openingTime: string;
  closingTime: string;
  /** Jours d'ouverture : 1 = lundi ... 7 = dimanche. */
  openDays: number[];
  /** Codes des prestations réalisées par le garage. */
  serviceCodes: string[];
};

/** Créneau de rendez-vous, à l'heure locale du garage. */
export type Slot = {
  /** "09:30" */
  time: string;
  available: boolean;
};

export type DayAvailability = {
  /** "2026-10-05" */
  date: string;
  slots: Slot[];
};

/** Vrai si le garage réalise toutes les prestations demandées. */
export function garageOffers(garage: Pick<Garage, "serviceCodes">, serviceCodes: string[]): boolean {
  return serviceCodes.every((code) => garage.serviceCodes.includes(code));
}

/** Places sur une période [start, end[ en UTC (ISO 8601) : free mécaniciens libres sur total présents. */
export type CapacityPeriod = {
  start: string;
  end: string;
  free: number;
  total: number;
};

/** Résultat de la vérification d'un créneau. */
export type SlotCheck = {
  available: boolean;
  /** Raison si le créneau n'est pas disponible. */
  message: string | null;
  /** Durée de travail, hors pauses. */
  durationMinutes: number;
  /** Fin estimée (UTC, ISO 8601), pauses du mécanicien comprises, si le créneau est disponible. */
  estimatedEndAt: string | null;
  /** Conseil non bloquant (ex. prestation à durée incertaine l'après-midi). */
  warning: string | null;
};

/** Mécanicien d'un garage (affectation des interventions). */
export type Mechanic = {
  id: number;
  firstName: string;
  lastName: string;
};
