import { ApiClient } from "@atelio/core/data";
import type { TenantConfig } from "@/tenants";

// Client de l'API pour une marque, uniquement côté serveur (pages, layouts, server actions).
// token : jeton de session du client connecté, pour les routes /me.
export function apiClient(apiTenant: TenantConfig["apiTenant"], token?: string): ApiClient {
  const baseUrl = process.env.API_URL;
  if (!baseUrl) throw new Error("API_URL n'est pas configurée (voir .env.example).");
  return new ApiClient({ baseUrl, tenant: apiTenant, token });
}
