import { GetGarages } from "@atelio/core/domain";
import { CachedGarageRepository } from "@/lib/garage/CachedGarageRepository";
import { toGarage, type Garage } from "@/lib/garage/garages";
import { getTenant } from "@/tenants";

/**
 * Garages actifs de la marque blanche, prêts à afficher.
 * Si l'API ne répond pas, renvoie une liste vide pour que le site reste affiché.
 */
export async function getGarages(tenantSlug: string): Promise<Garage[]> {
  const tenant = getTenant(tenantSlug);
  if (!tenant) return [];

  try {
    return (await new GetGarages(new CachedGarageRepository(tenant.apiTenant)).execute()).map(toGarage);
  } catch (error) {
    console.error(`[api] garages indisponibles pour ${tenantSlug} :`, error);
    return [];
  }
}
