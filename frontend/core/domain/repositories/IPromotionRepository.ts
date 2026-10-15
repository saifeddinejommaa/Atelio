import type { Promotion, PromotionInput } from "../entities/Promotion";

export interface IPromotionRepository {
  /** Promotions en cours aujourd'hui (site, choix sur une ligne d'intervention). */
  getActive(): Promise<Promotion[]>;
  /** Toutes les promotions (back-office). */
  getAll(): Promise<Promotion[]>;
  /** Ajoute une promotion (active) et renvoie son identifiant. */
  create(promotion: PromotionInput): Promise<number>;
  update(promotionId: number, promotion: PromotionInput): Promise<void>;
  setActive(promotionId: number, isActive: boolean): Promise<void>;
}
