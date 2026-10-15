import type { Garage, StaffMember } from '@atelio/core/domain'
import { useOutletContext } from 'react-router'

export type CurrentGarageContext = { garage: Garage; staff: StaffMember }

/** Garage choisi dans le menu (fourni par Layout aux pages). */
export function useCurrentGarage(): Garage {
  return useOutletContext<CurrentGarageContext>().garage
}

/** Personne connectée (rôle : Admin ou Staff). */
export function useStaff(): StaffMember {
  return useOutletContext<CurrentGarageContext>().staff
}
