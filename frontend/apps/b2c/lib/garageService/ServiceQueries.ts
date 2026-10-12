import { GetServiceByCode, GetServices } from "@atelio/core/domain";
import { CachedServiceRepository } from "@/lib/garageService/CachedServiceRepository";
import { toService, type Service } from "@/lib/garageService/services";
import { getTenant } from "@/tenants";

function repositoryFor(tenantSlug: string): CachedServiceRepository | undefined {
  const tenant = getTenant(tenantSlug);
  return tenant && new CachedServiceRepository(tenant.apiTenant);
}

/**
 * Prestations actives de la marque blanche, prêtes à afficher.
 * Si l'API ne répond pas, renvoie une liste vide pour que le site reste affiché.
 */
export async function getServices(tenantSlug: string): Promise<Service[]> {
  const repository = repositoryFor(tenantSlug);
  if (!repository) return [];

  try {
    return (await new GetServices(repository).execute()).map(toService);
  } catch (error) {
    console.error(`[api] services indisponibles pour ${tenantSlug} :`, error);
    return [];
  }
}

export async function getServiceBySlug(tenantSlug: string, slug: string): Promise<Service | undefined> {
  const repository = repositoryFor(tenantSlug);
  if (!repository) return undefined;

  try {
    const service = await new GetServiceByCode(repository).execute(slug);
    return service && toService(service);
  } catch (error) {
    console.error(`[api] service ${slug} indisponible pour ${tenantSlug} :`, error);
    return undefined;
  }
}
