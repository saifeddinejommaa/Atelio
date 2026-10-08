import { GarageApiRepository, InterventionApiRepository, type ApiClient } from '@atelio/core/data'
import { GetGarageMechanics, GetIntervention, GetServiceCategories, type Intervention, type Mechanic, type ServiceCategory } from '@atelio/core/domain'
import type { LoaderFunctionArgs } from 'react-router'

export type InterventionData = {
  intervention: Intervention
  /** Mécaniciens du garage, pour changer celui qui est chargé de l'intervention. */
  mechanics: Mechanic[]
  /** Catégories de prestations (taux horaire), pour la main-d'œuvre. */
  categories: ServiceCategory[]
}

export function interventionLoader(api: ApiClient) {
  return async ({ params }: LoaderFunctionArgs): Promise<InterventionData> => {
    const intervention = await new GetIntervention(new InterventionApiRepository(api)).execute(Number(params.id))
    if (!intervention) throw new Response('Intervention introuvable', { status: 404 })

    const [mechanics, categories] = await Promise.all([
      new GetGarageMechanics(new GarageApiRepository(api)).execute(intervention.garageId),
      new GetServiceCategories(new InterventionApiRepository(api)).execute(),
    ])
    return { intervention, mechanics, categories }
  }
}
