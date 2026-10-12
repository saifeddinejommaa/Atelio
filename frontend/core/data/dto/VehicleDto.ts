/** Véhicule tel que renvoyé par GET /api/vehicles/{id} et les listes de véhicules d'un client. */
export type VehicleDto = {
  id: number;
  customerId: number;
  plate: string;
  make: string | null;
  model: string | null;
  version: string | null;
  year: number | null;
  /** "2009-05-12" */
  firstRegistration: string | null;
  /** petrol, diesel, hybrid_petrol, hybrid_diesel, electric, lpg, other */
  fuel: string | null;
  /** manual, automatic */
  gearbox: string | null;
  weightKg: number | null;
  /** city, compact, suv, utility */
  category: string | null;
  mileage: number | null;
  missingDetails: string[] | null;
};
