import { InvoiceStatus, VAT_RATE, type Invoice, type InvoiceLine } from '@atelio/core/domain'
import { Link, useLoaderData } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import { paymentMethods } from '../interventions/InterventionStatus'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const qty = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** "2026-10-05" (date locale) => "05/10/2026". */
function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return date.format(new Date(y, m - 1, d))
}

/**
 * Facture imprimable (A4). Le bouton ouvre l'impression du navigateur, qui permet aussi d'enregistrer en PDF.
 * Le menu et les boutons sont masqués à l'impression (voir index.css).
 */
export default function InvoicePage() {
  const invoice = useLoaderData<Invoice>()
  const { brand } = useBrand()
  const labour = invoice.lines.filter((l) => l.kind === 'labour')
  const parts = invoice.lines.filter((l) => l.kind === 'part')
  const vehicle = [invoice.vehicleMake, invoice.vehicleModel].filter(Boolean).join(' ')

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/interventions/${invoice.interventionId}`} className="text-sm text-zinc-500 hover:underline">
          ← Intervention n°{invoice.interventionId}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-brand bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary"
        >
          Imprimer / Enregistrer en PDF
        </button>
      </div>

      <article className="invoice mx-auto max-w-[210mm] bg-white p-10 text-sm text-zinc-800 shadow-sm">
        <header className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <img src={brand.logo} alt="" className="h-12 w-auto" />
            <div>
              <p className="text-base font-bold">{brand.legal.companyName}</p>
              <p className="text-zinc-600">{brand.legal.address}</p>
              <p className="text-zinc-600">SIRET {brand.legal.siret}</p>
              <p className="text-zinc-600">TVA {brand.legal.vatNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold tracking-tight">FACTURE</p>
            <p className="font-mono font-semibold">{invoice.number}</p>
            <p className="mt-1 text-zinc-600">Date : {date.format(new Date(invoice.issuedAt))}</p>
            {invoice.dueDate && <p className="text-zinc-600">Échéance : {formatDay(invoice.dueDate)}</p>}
            {invoice.status.id === InvoiceStatus.Paid && (
              <p className="mt-2 inline-block rounded border-2 border-emerald-600 px-2 py-0.5 font-bold uppercase text-emerald-700">Payée</p>
            )}
          </div>
        </header>

        <section className="mt-8 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Client</p>
            <p className="mt-1 font-semibold">
              {invoice.customerFirstName} {invoice.customerLastName}
            </p>
            {invoice.customerPhone && <p>{invoice.customerPhone}</p>}
            {invoice.customerEmail && <p>{invoice.customerEmail}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Véhicule</p>
            <p className="mt-1 font-mono font-semibold">{invoice.vehiclePlate}</p>
            {vehicle && <p>{vehicle}</p>}
            {invoice.mileage !== null && <p>{invoice.mileage.toLocaleString('fr-FR')} km</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Garage</p>
            <p className="mt-1 font-semibold">
              {brand.name} {invoice.garageName}
            </p>
            <p>{invoice.garageAddress}</p>
            {invoice.garagePhone && <p>{invoice.garagePhone}</p>}
            {invoice.appointmentReference && <p className="font-mono text-xs text-zinc-500">Rendez-vous {invoice.appointmentReference}</p>}
          </div>
        </section>

        <table className="mt-8 w-full">
          <thead className="border-b-2 border-zinc-800 text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="py-2">Désignation</th>
              <th className="py-2">Réf.</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">PU TTC</th>
              <th className="py-2 text-right">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            <Section title="Main-d'œuvre" lines={labour} />
            <Section title="Pièces et fournitures" lines={parts} />
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-72 space-y-1">
            <div className="flex justify-between">
              <dt>Total HT</dt>
              <dd>{euro.format(invoice.totalHt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>TVA {VAT_RATE * 100} %</dt>
              <dd>{euro.format(invoice.totalVat)}</dd>
            </div>
            <div className="flex justify-between border-t-2 border-zinc-800 pt-1 text-base font-bold">
              <dt>Total TTC</dt>
              <dd>{euro.format(invoice.totalTtc)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6">
          {invoice.status.id === InvoiceStatus.Paid && invoice.paidAt
            ? `Réglée le ${date.format(new Date(invoice.paidAt))}${invoice.paymentMethod ? ` par ${paymentMethods[invoice.paymentMethod].toLowerCase()}` : ''}.`
            : 'À régler à réception.'}
        </p>

        <footer className="mt-10 border-t border-zinc-200 pt-3 text-center text-xs text-zinc-500">
          {brand.legal.companyName} · capital {brand.legal.capital} · {brand.legal.rcs} · SIRET {brand.legal.siret} · TVA{' '}
          {brand.legal.vatNumber}
        </footer>
      </article>
    </>
  )
}

function Section({ title, lines }: { title: string; lines: InvoiceLine[] }) {
  if (lines.length === 0) return null
  return (
    <>
      <tr>
        <td colSpan={5} className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </td>
      </tr>
      {lines.map((l, i) => (
        <tr key={`${title}-${i}`} className="border-b border-zinc-100">
          <td className="py-1.5">{l.label}</td>
          <td className="py-1.5 font-mono text-xs">{l.reference ?? ''}</td>
          <td className="py-1.5 text-right">{qty.format(l.quantity)}</td>
          <td className="py-1.5 text-right">{euro.format(l.unitPrice)}</td>
          <td className="py-1.5 text-right">{euro.format(l.total)}</td>
        </tr>
      ))}
    </>
  )
}
