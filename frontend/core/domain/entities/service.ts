/** Prestation proposée par une marque (vidange, freinage...). */
export type Service = {
  id: number;
  /** Identifiant stable de la prestation (ex. "vidange"). */
  code: string;
  name: string;
  description: string | null;
  /** null : pas de durée exacte (ex. Autre), le garage indique le temps à la prise de rendez-vous. */
  durationMinutes: number | null;  /** Prix TTC avant promotion. */
  price: number;
  /** Meilleure remise active (ex. 20 pour -20 %), null si aucune. */
  discountPercent: number | null;
  /** Prix TTC après promotion. */
  finalPrice: number;
};

/** Prestation dans le back-office : active ou non, avec son type d'intervention. */
export type ManagedService = Service & {
  /** Désactivée : plus proposée sur le site ni à la prise de rendez-vous. */
  isActive: boolean;
  /** Type d'intervention : donne le taux horaire de main-d'œuvre. */
  categoryId: number | null;
  categoryName: string | null;
};

/** Prestation à enregistrer. */
export type ServiceInput = Pick<Service, "name" | "description" | "price" | "durationMinutes"> & {
  categoryId: number | null;
};
