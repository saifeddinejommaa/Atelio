/** Offre commerciale d'une marque. */
export type Offer = {
  id: string;
  title: string;
  /** Accroche affichée en grand (ex. "-20 %"). */
  highlight: string;
  description: string;
  /** Codes des prestations concernées. */
  serviceCodes: string[];
  /** Dernier jour de validité, au format AAAA-MM-JJ. */
  validUntil: string;
  conditions: string;
};
