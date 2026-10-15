import type { Promotion, PromotionInput } from "../entities/Promotion";
import { ValidationError } from "../errors";
import type { IPromotionRepository } from "../repositories/IPromotionRepository";

/** Vérifie une promotion saisie et la nettoie (description, fin et conditions facultatives). */
function checkPromotion(promotion: PromotionInput): PromotionInput {
  const title = promotion.title.trim();
  if (!promotion.serviceId) throw new ValidationError("Choisissez la prestation.");
  if (!title) throw new ValidationError("Indiquez le titre de la promotion.");
  if (!(promotion.discountPercent > 0 && promotion.discountPercent <= 100)) {
    throw new ValidationError("La remise doit être comprise entre 0 et 100 %.");
  }
  if (!promotion.startsOn) throw new ValidationError("Indiquez la date de début.");
  const endsOn = promotion.endsOn || null;
  if (endsOn !== null && endsOn < promotion.startsOn) {
    throw new ValidationError("La date de fin doit être après la date de début.");
  }
  return {
    serviceId: promotion.serviceId,
    title,
    description: promotion.description?.trim() || null,
    discountPercent: promotion.discountPercent,
    startsOn: promotion.startsOn,
    endsOn,
    conditions: promotion.conditions?.trim() || null,
  };
}

/** Promotions en cours aujourd'hui. */
export class GetActivePromotions {
  constructor(private readonly repository: IPromotionRepository) {}

  execute(): Promise<Promotion[]> {
    return this.repository.getActive();
  }
}

/** Toutes les promotions (back-office). */
export class GetPromotions {
  constructor(private readonly repository: IPromotionRepository) {}

  execute(): Promise<Promotion[]> {
    return this.repository.getAll();
  }
}

export class CreatePromotion {
  constructor(private readonly repository: IPromotionRepository) {}

  async execute(promotion: PromotionInput): Promise<number> {
    return this.repository.create(checkPromotion(promotion));
  }
}

/** Modifie une promotion : les lignes d'intervention déjà remisées gardent leur remise. */
export class UpdatePromotion {
  constructor(private readonly repository: IPromotionRepository) {}

  async execute(promotionId: number, promotion: PromotionInput): Promise<void> {
    return this.repository.update(promotionId, checkPromotion(promotion));
  }
}

/** Désactive (plus affichée ni applicable) ou réactive une promotion. */
export class SetPromotionActive {
  constructor(private readonly repository: IPromotionRepository) {}

  execute(promotionId: number, isActive: boolean): Promise<void> {
    return this.repository.setActive(promotionId, isActive);
  }
}
