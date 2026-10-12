import type { Invoice } from '@atelio/core/domain'
import { Link, useLoaderData, useRevalidator } from 'react-router'
import InvoicePdfViewer from './InvoicePdfViewer'

/** Facture : PDF stocké (téléchargeable, imprimable depuis le lecteur PDF du navigateur). */
export default function InvoicePage() {
  const invoice = useLoaderData<Invoice>()
  const revalidator = useRevalidator()

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/interventions/${invoice.interventionId}`} className="text-sm text-zinc-500 hover:underline">
          ← Intervention n°{invoice.interventionId}
        </Link>
        <Link to="/factures" className="text-sm text-zinc-500 hover:underline">
          Toutes les factures
        </Link>
      </div>

      <InvoicePdfViewer invoice={invoice} onChanged={() => revalidator.revalidate()} />
    </>
  )
}
