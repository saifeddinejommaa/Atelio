/** Prestation proposée par une marque (vidange, freinage...). */
export type Service = {
  id: number;
  /** Identifiant stable de la prestation (ex. "vidange"). */
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  /** Durée incertaine (ex. « Autre ») : à placer de préférence le matin. */
  uncertainDuration: boolean;
  /** Prix TTC avant promotion. */
  price: number;
  /** Meilleure remise active (ex. 20 pour -20 %), null si aucune. */
  discountPercent: number | null;
  /** Prix TTC après promotion. */
  finalPrice: number;
};
