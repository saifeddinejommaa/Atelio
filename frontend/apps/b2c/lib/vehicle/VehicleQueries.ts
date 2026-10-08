import { VehicleApiRepository } from "@atelio/core/data";
import { GetCustomerVehicles } from "@atelio/core/domain";
import { apiClient } from "@/lib/api";
import { getSessionCustomer } from "@/lib/customer/CustomerQueries";
import { toVehicle, type Vehicle } from "@/lib/vehicle/vehicles";
import { getTenant } from "@/tenants";

/**
 * Véhicules du compte connecté.
 * Si l'API ne répond pas, renvoie une liste vide : le client peut toujours saisir une immatriculation.
 */
export async function getSessionVehicles(tenantSlug: string): Promise<Vehicle[]> {
  const tenant = getTenant(tenantSlug);
  if (!tenant) return [];

  try {
    const customer = await getSessionCustomer(tenant.slug);
    if (!customer) return [];

    const repository = new VehicleApiRepository(apiClient(tenant.apiTenant));
    return (await new GetCustomerVehicles(repository).execute(customer.id)).map(toVehicle);
  } catch (error) {
    console.error(`[api] véhicules indisponibles pour ${tenantSlug} :`, error);
    return [];
  }
}
