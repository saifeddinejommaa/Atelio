import { MyAccountApiRepository } from "@atelio/core/data";
import { GetMyVehicles } from "@atelio/core/domain";
import { sessionApiClient } from "@/lib/session";
import { toVehicle, type Vehicle } from "@/lib/vehicle/vehicles";

/**
 * Véhicules du compte connecté.
 * Si l'API ne répond pas, renvoie une liste vide : le client peut toujours saisir une immatriculation.
 */
export async function getSessionVehicles(tenantSlug: string): Promise<Vehicle[]> {
  const api = await sessionApiClient(tenantSlug);
  if (!api) return [];

  try {
    return (await new GetMyVehicles(new MyAccountApiRepository(api)).execute()).map(toVehicle);
  } catch (error) {
    console.error(`[api] véhicules indisponibles pour ${tenantSlug} :`, error);
    return [];
  }
}
