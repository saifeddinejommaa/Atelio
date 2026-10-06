import type { TenantConfig } from "./types";
import gmg78 from "./gmg78";
import sej from "./sej";

// Liste des clients actifs. Ajouter ici chaque nouveau fichier client.
const tenants: TenantConfig[] = [gmg78, sej];

/** En-tête posé par proxy.ts quand le client est reconnu par son domaine. */
export const TENANT_BASE_HEADER = "x-tenant-base";

/** Client avec le préfixe d'URL à utiliser pour ses liens ("" sur son domaine, "/slug" sinon). */
export type SiteTenant = TenantConfig & { basePath: string };

export function getTenant(slug: string): TenantConfig | undefined {
  return tenants.find((t) => t.slug === slug);
}

export function getAllTenants(): TenantConfig[] {
  return tenants;
}

/**
 * Trouve le client à partir du nom d'hôte :
 * - un domaine du client (ex. mon-garage.fr ou www.mon-garage.fr) ;
 * - un sous-domaine du domaine commun (ex. sej.<TENANT_BASE_DOMAIN>).
 */
export function getTenantByHost(host: string, baseDomain?: string): TenantConfig | undefined {
  const hostname = host.split(":")[0].toLowerCase().replace(/^www\./, "");

  const byDomain = tenants.find((t) => t.domains.includes(hostname));
  if (byDomain) return byDomain;

  if (baseDomain && hostname.endsWith(`.${baseDomain}`)) {
    return getTenant(hostname.slice(0, -(baseDomain.length + 1)));
  }
  return undefined;
}

/** Lien interne du client : tenantPath(tenant, "/devis") → "/devis" ou "/gmg78/devis". */
export function tenantPath(tenant: SiteTenant, path = "/"): string {
  if (path === "/") return tenant.basePath || "/";
  return `${tenant.basePath}${path}`;
}

export type { TenantConfig };
