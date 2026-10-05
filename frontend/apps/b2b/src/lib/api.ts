import { ApiClient } from '@atelio/core/data'
import type { Brand } from '@atelio/core/domain'

/** Client de l'API pour la marque (en-tête X-Tenant). */
export function apiClientFor(brand: Brand): ApiClient {
  return new ApiClient({ baseUrl: import.meta.env.VITE_API_URL ?? '', tenant: brand.apiTenant })
}
