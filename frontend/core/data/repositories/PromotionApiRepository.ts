import type { IPromotionRepository, Promotion, PromotionInput } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";

/** Élément de GET /api/promotions (même forme que l'entité). */
export type PromotionDto = Promotion;

const toPromotion = (p: PromotionDto): Promotion => ({
  id: p.id,
  title: p.title,
  description: p.description,
  discountPercent: p.discountPercent,
  startsOn: p.startsOn,
  endsOn: p.endsOn,
  conditions: p.conditions,
  isActive: p.isActive,
  serviceId: p.serviceId,
  serviceCode: p.serviceCode,
  serviceName: p.serviceName,
  servicePrice: p.servicePrice,
  discountedPrice: p.discountedPrice,
});

export class PromotionApiRepository implements IPromotionRepository {
  constructor(private readonly api: ApiClient) {}

  async getActive(): Promise<Promotion[]> {
    return ((await this.api.get<PromotionDto[]>("/promotions")) ?? []).map(toPromotion);
  }

  async getAll(): Promise<Promotion[]> {
    return ((await this.api.get<PromotionDto[]>("/promotions/all")) ?? []).map(toPromotion);
  }

  async create(promotion: PromotionInput): Promise<number> {
    const created = await this.api.post<{ id: number }>("/promotions", promotion);
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé la promotion ajoutée.");
    return created.id;
  }

  async update(promotionId: number, promotion: PromotionInput): Promise<void> {
    await this.api.put(`/promotions/${promotionId}`, promotion);
  }

  async setActive(promotionId: number, isActive: boolean): Promise<void> {
    await this.api.put(`/promotions/${promotionId}/active`, { isActive });
  }
}
