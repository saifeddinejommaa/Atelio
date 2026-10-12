import {
  ArticleApiRepository,
  GarageApiRepository,
  InterventionApiRepository,
  QuoteApiRepository,
  VehicleApiRepository,
  type ApiClient,
} from '@atelio/core/data'
import {
  GetArticles,
  GetCustomerQuotes,
  GetGarageMechanics,
  GetIntervention,
  GetVehicle,
  type Article,
  type CustomerVehicle,
  type GarageQuoteSummary,
  type Intervention,
  type Mechanic,
} from '@atelio/core/domain'
import type { LoaderFunctionArgs } from 'react-router'

export type InterventionData = {
  intervention: Intervention
  /** Véhicule de l'intervention, avec ses informations de carte grise. */
  vehicle: CustomerVehicle
  /** Mécaniciens du garage, pour changer celui qui est chargé de l'intervention. */
  mechanics: Mechanic[]
  /** Articles actifs du catalogue, pour l'autocomplete. */
  catalog: Article[]
  /** Devis du client, à importer sur l'intervention. */
  quotes: GarageQuoteSummary[]
}

export function interventionLoader(api: ApiClient) {
  return async ({ params }: LoaderFunctionArgs): Promise<InterventionData> => {
    const intervention = await new GetIntervention(new InterventionApiRepository(api)).execute(Number(params.id))
    if (!intervention) throw new Response('Intervention introuvable', { status: 404 })

    const [vehicle, mechanics, catalog, quotes] = await Promise.all([
      new GetVehicle(new VehicleApiRepository(api)).execute(intervention.vehicleId),
      new GetGarageMechanics(new GarageApiRepository(api)).execute(intervention.garageId),
      new GetArticles(new ArticleApiRepository(api)).execute({ active: true }),
      new GetCustomerQuotes(new QuoteApiRepository(api)).execute(intervention.customerId),
    ])
    if (!vehicle) throw new Response('Véhicule introuvable', { status: 404 })
    return { intervention, vehicle, mechanics, catalog, quotes }
  }
}
