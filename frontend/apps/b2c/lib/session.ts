import { cache } from "react";
import { cookies } from "next/headers";
import { MyAccountApiRepository } from "@atelio/core/data";
import { GetMyProfile, type CustomerLogin } from "@atelio/core/domain";
import { apiClient } from "@/lib/api";
import { getTenant } from "@/tenants";

// Session du client : le jeton émis par l'API (/api/auth/customer) est stocké dans un cookie
// httpOnly propre à chaque marque blanche. Le navigateur ne le lit jamais ; seul le serveur Next l'envoie à l'API.
export type SessionUser = { id: number; name: string; email: string; phone: string };

export function sessionCookieName(tenantSlug: string) {
  return `session_${tenantSlug}`;
}

/** Jeton de session du client pour cette marque, ou null. */
export async function getSessionToken(tenantSlug: string): Promise<string | null> {
  return (await cookies()).get(sessionCookieName(tenantSlug))?.value ?? null;
}

/** Ouvre la session (à appeler depuis une server action). */
export async function openSession(tenantSlug: string, login: Extract<CustomerLogin, { kind: "session" }>) {
  (await cookies()).set(sessionCookieName(tenantSlug), login.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(login.expiresAt),
  });
}

export async function closeSession(tenantSlug: string) {
  (await cookies()).delete(sessionCookieName(tenantSlug));
}

/** Client de l'API authentifié pour le compte connecté, ou null (non connecté). */
export async function sessionApiClient(tenantSlug: string) {
  const tenant = getTenant(tenantSlug);
  const token = await getSessionToken(tenantSlug);
  return tenant && token ? apiClient(tenant.apiTenant, token) : null;
}

/**
 * Client connecté, ou null (pas de cookie, jeton expiré, compte désactivé).
 * Un seul appel à l'API par requête, même si plusieurs composants le demandent.
 */
export const getSessionUser = cache(async (tenantSlug: string): Promise<SessionUser | null> => {
  const api = await sessionApiClient(tenantSlug);
  if (!api) return null;

  try {
    const customer = await new GetMyProfile(new MyAccountApiRepository(api)).execute();
    if (!customer) return null;
    return {
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email ?? "",
      phone: customer.phone ?? "",
    };
  } catch (error) {
    console.error(`[api] profil indisponible pour ${tenantSlug} :`, error);
    return null;
  }
});
