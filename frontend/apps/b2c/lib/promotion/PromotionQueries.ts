import { PromotionApiRepository } from "@atelio/core/data";
import { GetActivePromotions, type Promotion } from "@atelio/core/domain";
import { apiClient } from "@/lib/api";
import { getTenant } from "@/tenants";

/**
 * Promotions en cours de la marque blanche (page « Offres du moment »).
 * Si l'API ne répond pas, renvoie une liste vide pour que le site reste affiché.
 */
export async function getActivePromotions(tenantSlug: string): Promise<Promotion[]> {
  const tenant = getTenant(tenantSlug);
  if (!tenant) return [];

  try {
    return await new GetActivePromotions(new PromotionApiRepository(apiClient(tenant.apiTenant))).execute();
  } catch (error) {
    console.error(`[api] promotions indisponibles pour ${tenantSlug} :`, error);
    return [];
  }
}
