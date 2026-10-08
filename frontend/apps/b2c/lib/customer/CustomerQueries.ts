import { cache } from "react";
import { CustomerApiRepository } from "@atelio/core/data";
import { GetCustomerByEmail, type Customer } from "@atelio/core/domain";
import { apiClient } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { getTenant } from "@/tenants";

const fetchCustomer = cache(
  (apiTenant: string, email: string): Promise<Customer | null> =>
    new GetCustomerByEmail(new CustomerApiRepository(apiClient(apiTenant))).execute(email),
);

/** Client de l'API correspondant au compte connecté, ou null (non connecté ou client inconnu). */
export async function getSessionCustomer(tenantSlug: string): Promise<Customer | null> {
  const tenant = getTenant(tenantSlug);
  const user = tenant && (await getSessionUser(tenant.slug));
  if (!tenant || !user) return null;

  return fetchCustomer(tenant.apiTenant, user.email);
}
