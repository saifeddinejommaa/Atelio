import { QuoteApiRepository, type ApiClient } from '@atelio/core/data'
import { GetQuote, type GarageQuote } from '@atelio/core/domain'
import type { LoaderFunctionArgs } from 'react-router'

export function quoteLoader(api: ApiClient) {
  return async ({ params }: LoaderFunctionArgs): Promise<GarageQuote> => {
    const quote = await new GetQuote(new QuoteApiRepository(api)).execute(Number(params.id))
    if (!quote) throw new Response('Devis introuvable', { status: 404 })
    return quote
  }
}
