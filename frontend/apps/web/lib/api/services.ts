import { cache } from "react";
import { apiGet } from "@/lib/api/client";
import { toService, type Service } from "@/lib/services";
import { getTenant } from "@/tenants";

/** Service tel que renvoyé par GET /api/services. */
export type ApiService = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  /** Prix TTC avant promotion. */
  price: number;
  /** Meilleure remise active (ex. 20 pour -20 %), null si aucune. */
  discountPercent: number | null;
  /** Prix TTC après promotion. */
  finalPrice: number;
};

/**
 * Services actifs de la marque blanche, avec leur prix et leur promotion éventuelle.
 * Mis en cache le temps d'une requête (le layout et la page partagent le même appel).
 * Si l'API ne répond pas, renvoie une liste vide pour que le site reste affiché.
 */
export const getServices = cache(async (tenantSlug: string): Promise<Service[]> => {
  const tenant = getTenant(tenantSlug);
  if (!tenant) return [];

  try {
    const services = await apiGet<ApiService[]>(tenant, "/services");
    return (services ?? []).map(toService);
  } catch (error) {
    console.error(`[api] services indisponibles pour ${tenant.slug} :`, error);
    return [];
  }
});

export async function getServiceBySlug(tenantSlug: string, slug: string): Promise<Service | undefined> {
  return (await getServices(tenantSlug)).find((s) => s.slug === slug);
}
