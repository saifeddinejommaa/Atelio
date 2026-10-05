import type { TenantConfig } from "./types";
import garageDupont from "./garage-dupont";
import autoExpress from "./auto-express";

// Liste des clients actifs. Ajouter ici chaque nouveau fichier client.
const tenants: TenantConfig[] = [garageDupont, autoExpress];

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
 * - un domaine du client (ex. auto-express.com ou www.auto-express.com) ;
 * - un sous-domaine du domaine commun (ex. auto-express.<TENANT_BASE_DOMAIN>).
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

/** Lien interne du client : tenantPath(tenant, "/devis") → "/devis" ou "/garage-dupont/devis". */
export function tenantPath(tenant: SiteTenant, path = "/"): string {
  if (path === "/") return tenant.basePath || "/";
  return `${tenant.basePath}${path}`;
}

export type { TenantConfig };
