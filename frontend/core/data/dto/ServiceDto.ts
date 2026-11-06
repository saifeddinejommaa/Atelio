/** Service tel que renvoyé par GET /api/services. */
export type ServiceDto = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  price: number;
  discountPercent: number | null;
  finalPrice: number;
};
