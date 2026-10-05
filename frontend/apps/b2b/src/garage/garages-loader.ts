import { GarageApiRepository, type ApiClient } from '@atelio/core/data'
import { GetGarages, type Garage } from '@atelio/core/domain'
import { currentUser } from '../access/current-user'

export type GaragesData = {
  /** Garages de la société auxquels l'utilisateur a accès. */
  garages: Garage[]
  /** Nombre de garages de la société (sélecteur masqué s'il n'y en a qu'un). */
  companyGarageCount: number
}

export function garagesLoader(api: ApiClient) {
  return async (): Promise<GaragesData> => {
    const all = await new GetGarages(new GarageApiRepository(api)).execute()
    return {
      garages: all.filter((g) => currentUser.garageIds.includes(g.id)),
      companyGarageCount: all.length,
    }
  }
}
