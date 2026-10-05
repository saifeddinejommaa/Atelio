import { InvoiceApiRepository, type ApiClient } from '@atelio/core/data'
import { GetInvoice, type Invoice } from '@atelio/core/domain'
import type { LoaderFunctionArgs } from 'react-router'

export function invoiceLoader(api: ApiClient) {
  return async ({ params }: LoaderFunctionArgs): Promise<Invoice> => {
    const invoice = await new GetInvoice(new InvoiceApiRepository(api)).execute(Number(params.id))
    if (!invoice) throw new Response('Facture introuvable', { status: 404 })
    return invoice
  }
}
