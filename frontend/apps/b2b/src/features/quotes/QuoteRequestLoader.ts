import { ArticleApiRepository, QuoteRequestApiRepository, VehicleApiRepository, type ApiClient } from '@atelio/core/data'
import {
  GetArticles,
  GetCustomerVehicles,
  GetQuoteRequest,
  GetQuoteRequests,
  type Article,
  type CustomerVehicle,
  type QuoteRequest,
} from '@atelio/core/domain'
import type { LoaderFunctionArgs } from 'react-router'

export function quoteRequestsLoader(api: ApiClient) {
  return (): Promise<QuoteRequest[]> => new GetQuoteRequests(new QuoteRequestApiRepository(api)).execute()
}

export type QuoteRequestData = {
  request: QuoteRequest
  vehicles: CustomerVehicle[]
  /** Articles actifs du catalogue, pour créer le devis. */
  catalog: Article[]
}

export function quoteRequestLoader(api: ApiClient) {
  return async ({ params }: LoaderFunctionArgs): Promise<QuoteRequestData> => {
    const request = await new GetQuoteRequest(new QuoteRequestApiRepository(api)).execute(Number(params.id))
    if (!request) throw new Response('Demande de devis introuvable', { status: 404 })

    const [vehicles, catalog] = await Promise.all([
      new GetCustomerVehicles(new VehicleApiRepository(api)).execute(request.customerId),
      new GetArticles(new ArticleApiRepository(api)).execute({ active: true }),
    ])
    return { request, vehicles, catalog }
  }
}
