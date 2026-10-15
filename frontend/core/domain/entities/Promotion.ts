/** Remise en % sur une prestation, affichée sur le site pendant sa période et applicable aux articles des interventions. */
export type Promotion = {
  id: number;
  title: string;
  description: string | null;
  /** Ex. 20 pour -20 %. */
  discountPercent: number;
  /** Premier jour d'affichage, AAAA-MM-JJ. */
  startsOn: string;
  /** Dernier jour (inclus), AAAA-MM-JJ ; null : sans fin. */
  endsOn: string | null;
  /** Petit texte affiché sous l'offre (ex. « Non cumulable avec d'autres offres. »). */
  conditions: string | null;
  /** Désactivée : plus affichée ni applicable, même pendant sa période. */
  isActive: boolean;
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  /** Prix TTC de la prestation, avant et après remise. */
  servicePrice: number;
  discountedPrice: number;
};

/** Promotion à enregistrer. */
export type PromotionInput = Pick<
  Promotion,
  "serviceId" | "title" | "description" | "discountPercent" | "startsOn" | "endsOn" | "conditions"
>;

/** Où en est une promotion : désactivée, à venir, en cours ou terminée. */
export type PromotionState = "inactive" | "upcoming" | "current" | "ended";

/** État de la promotion au jour donné (AAAA-MM-JJ, jour local). */
export function promotionState(promotion: Pick<Promotion, "isActive" | "startsOn" | "endsOn">, today: string): PromotionState {
  if (!promotion.isActive) return "inactive";
  if (promotion.startsOn > today) return "upcoming";
  if (promotion.endsOn !== null && promotion.endsOn < today) return "ended";
  return "current";
}

/** Jour local au format AAAA-MM-JJ. */
export function localIsoDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
