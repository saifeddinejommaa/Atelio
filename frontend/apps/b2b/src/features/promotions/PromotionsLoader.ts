import { PromotionApiRepository, ServiceApiRepository, type ApiClient } from '@atelio/core/data'
import { GetPromotions, GetServices, type Promotion, type Service } from '@atelio/core/domain'

export type PromotionsData = {
  /** Toutes les promotions : la page filtre elle-même. */
  promotions: Promotion[]
  /** Prestations actives, à choisir pour une promotion. */
  services: Service[]
}

export function promotionsLoader(api: ApiClient) {
  return async (): Promise<PromotionsData> => {
    const [promotions, services] = await Promise.all([
      new GetPromotions(new PromotionApiRepository(api)).execute(),
      new GetServices(new ServiceApiRepository(api)).execute(),
    ])
    return { promotions, services }
  }
}
