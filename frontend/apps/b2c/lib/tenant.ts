import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTenant, TENANT_BASE_HEADER, type SiteTenant } from "@/tenants";

/** Charge le client de la page courante, ou renvoie une 404 s'il n'existe pas. */
export async function resolveTenant(params: Promise<{ tenant: string }>): Promise<SiteTenant> {
  const tenant = getTenant((await params).tenant);
  if (!tenant) notFound();

  // Posé par proxy.ts quand le visiteur arrive par le domaine du client.
  const base = (await headers()).get(TENANT_BASE_HEADER);
  return { ...tenant, basePath: base ?? `/${tenant.slug}` };
}
