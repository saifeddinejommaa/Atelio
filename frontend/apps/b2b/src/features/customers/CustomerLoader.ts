import { ArticleApiRepository, CustomerApiRepository, QuoteApiRepository, VehicleApiRepository, type ApiClient } from '@atelio/core/data'
import {
  GetArticles,
  GetCustomer,
  GetCustomerInvoices,
  GetCustomerQuotes,
  GetCustomerVehicles,
  type Article,
  type Customer,
  type CustomerInvoice,
  type CustomerVehicle,
  type GarageQuoteSummary,
} from '@atelio/core/domain'
import type { LoaderFunctionArgs } from 'react-router'

export type CustomerData = {
  customer: Customer
  vehicles: CustomerVehicle[]
  invoices: CustomerInvoice[]
  quotes: GarageQuoteSummary[]
  /** Articles actifs du catalogue, pour créer un devis. */
  catalog: Article[]
}

export function customerLoader(api: ApiClient) {
  return async ({ params }: LoaderFunctionArgs): Promise<CustomerData> => {
    const id = Number(params.id)
    const customers = new CustomerApiRepository(api)
    const [customer, vehicles, invoices, quotes, catalog] = await Promise.all([
      new GetCustomer(customers).execute(id),
      new GetCustomerVehicles(new VehicleApiRepository(api)).execute(id),
      new GetCustomerInvoices(customers).execute(id),
      new GetCustomerQuotes(new QuoteApiRepository(api)).execute(id),
      new GetArticles(new ArticleApiRepository(api)).execute({ active: true }),
    ])
    if (!customer) throw new Response('Client introuvable', { status: 404 })
    return { customer, vehicles, invoices, quotes, catalog }
  }
}
