import { ArticleApiRepository, QuoteApiRepository, VehicleApiRepository, type ApiClient } from '@atelio/core/data'
import { GetArticles, GetCustomerVehicles, GetQuote, type Article, type CustomerVehicle, type GarageQuote } from '@atelio/core/domain'
import type { LoaderFunctionArgs } from 'react-router'

export type QuoteData = {
  quote: GarageQuote
  /** Véhicules du client et articles actifs du catalogue, pour modifier le devis. */
  vehicles: CustomerVehicle[]
  catalog: Article[]
}

export function quoteLoader(api: ApiClient) {
  return async ({ params }: LoaderFunctionArgs): Promise<QuoteData> => {
    const quote = await new GetQuote(new QuoteApiRepository(api)).execute(Number(params.id))
    if (!quote) throw new Response('Devis introuvable', { status: 404 })

    // Devis figé : rien à charger pour le modifier.
    if (quote.sentAt || quote.isImported) return { quote, vehicles: [], catalog: [] }

    const [vehicles, catalog] = await Promise.all([
      new GetCustomerVehicles(new VehicleApiRepository(api)).execute(quote.customerId),
      new GetArticles(new ArticleApiRepository(api)).execute({ active: true }),
    ])
    return { quote, vehicles, catalog }
  }
}
