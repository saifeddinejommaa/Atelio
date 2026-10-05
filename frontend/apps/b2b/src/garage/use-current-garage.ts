import type { Garage } from '@atelio/core/domain'
import { useOutletContext } from 'react-router'

export type CurrentGarageContext = { garage: Garage }

/** Garage choisi dans le menu (fourni par Layout aux pages). */
export function useCurrentGarage(): Garage {
  return useOutletContext<CurrentGarageContext>().garage
}
