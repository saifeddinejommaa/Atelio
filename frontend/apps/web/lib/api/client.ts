import type { TenantConfig } from "@/tenants";

// Appels à l'API .NET, uniquement côté serveur (pages, layouts, server actions).
// Chaque appel envoie l'en-tête X-Tenant : l'API choisit la base de la marque blanche.

type ApiEnvelope<T> = { code: number; response: T | null; responseMessage: string | null };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function apiUrl(path: string): string {
  const base = process.env.API_URL;
  if (!base) throw new Error("API_URL n'est pas configurée (voir .env.example).");
  return `${base.replace(/\/$/, "")}/api${path}`;
}

/** GET sur l'API. Renvoie null si la ressource n'existe pas (404). */
export async function apiGet<T>(tenant: TenantConfig, path: string): Promise<T | null> {
  const res = await fetch(apiUrl(path), {
    headers: { "X-Tenant": tenant.apiTenant, Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 404) return null;

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !body) {
    throw new ApiError(res.status, body?.responseMessage ?? `Erreur API ${res.status} sur ${path}`);
  }
  return body.response;
}
