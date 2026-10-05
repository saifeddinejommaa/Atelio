/** Véhicule tel que renvoyé par GET /api/customers/{id}/vehicles. */
export type VehicleDto = {
  id: number;
  customerId: number;
  plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  /** petrol, diesel, hybrid, electric, lpg, other */
  fuel: string | null;
  /** city, compact, suv, utility */
  category: string | null;
  mileage: number | null;
};
