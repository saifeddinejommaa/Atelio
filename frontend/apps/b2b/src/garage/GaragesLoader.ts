import { GarageApiRepository, StaffApiRepository, type ApiClient } from '@atelio/core/data'
import { GetCurrentStaff, GetGarages, type Garage, type StaffMember } from '@atelio/core/domain'

export type GaragesData = {
  /** Personne connectée, ou null si son compte Microsoft n'a pas accès à cette marque. */
  staff: StaffMember | null
  /** Garages de la marque. */
  garages: Garage[]
  /** Nombre de garages de la société (sélecteur masqué s'il n'y en a qu'un). */
  companyGarageCount: number
}

export function garagesLoader(api: ApiClient) {
  return async (): Promise<GaragesData> => {
    const staff = await new GetCurrentStaff(new StaffApiRepository(api)).execute()
    if (!staff) return { staff: null, garages: [], companyGarageCount: 0 }

    const all = await new GetGarages(new GarageApiRepository(api)).execute()
    return {
      staff,
      garages: all,
      companyGarageCount: all.length,
    }
  }
}
