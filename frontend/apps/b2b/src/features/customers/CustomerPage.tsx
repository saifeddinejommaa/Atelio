import { fuelLabels, gearboxLabels, InvoiceStatus, type CustomerVehicle } from '@atelio/core/domain'
import { useState } from 'react'
import { Link, useLoaderData, useRevalidator } from 'react-router'
import SidePanel from '../../components/SidePanel'
import NewQuotePanel from '../quotes/NewQuotePanel'
import VehicleDetailsForm from '../vehicles/VehicleDetailsForm'
import type { CustomerData } from './CustomerLoader'
import EditCustomerPanel from './EditCustomerPanel'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const invoiceStatusClasses: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Draft]: 'bg-zinc-100 text-zinc-600',
  [InvoiceStatus.Issued]: 'bg-amber-50 text-amber-800',
  [InvoiceStatus.Paid]: 'bg-emerald-50 text-emerald-700',
  [InvoiceStatus.PartiallyPaid]: 'bg-amber-50 text-amber-800',
  [InvoiceStatus.Cancelled]: 'bg-zinc-100 text-zinc-500',
}

/** "2009-05-12" => "12/05/2009". */
function formatDay(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  return date.format(new Date(y, m - 1, d))
}

/** Fiche client : coordonnées et véhicules (modifiables), devis (création, impression, e-mail) et factures. */
export default function CustomerPage() {
  const { customer, vehicles, invoices, quotes, catalog } = useLoaderData<CustomerData>()
  const revalidator = useRevalidator()
  const [panel, setPanel] = useState<{ kind: 'customer' } | { kind: 'vehicle'; vehicle: CustomerVehicle } | { kind: 'quote' } | null>(null)

  async function saved() {
    setPanel(null)
    await revalidator.revalidate()
  }
  const totalPaid = invoices.filter((i) => i.status.id === InvoiceStatus.Paid).reduce((sum, i) => sum + i.totalTtc, 0)

  return (
    <>
      <Link to="/clients" className="text-sm text-zinc-500 hover:underline">
        ← Clients
      </Link>

      <header className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">
          {customer.firstName} {customer.lastName}
        </h1>
        {!customer.isActive && <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500">Désactivé</span>}
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-brand bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Coordonnées</h2>
            <button type="button" onClick={() => setPanel({ kind: 'customer' })} className="text-sm text-zinc-600 hover:underline">
              Modifier
            </button>
          </div>
          <dl className="mt-3 space-y-1 text-sm">
            <div>
              <dt className="inline text-zinc-500">Téléphone : </dt>
              <dd className="inline">
                {customer.phone ? (
                  <a href={`tel:${customer.phone.replace(/\s/g, '')}`} className="hover:underline">
                    {customer.phone}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="inline text-zinc-500">E-mail : </dt>
              <dd className="inline">
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="hover:underline">
                    {customer.email}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
          <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-sm">
            <div>
              <dt className="text-xs text-zinc-500">Factures</dt>
              <dd className="text-lg font-bold">{invoices.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Réglé (TTC)</dt>
              <dd className="text-lg font-bold">{euro.format(totalPaid)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-brand bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Véhicules</h2>
          {vehicles.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-400">Aucun véhicule.</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {vehicles.map((v) => (
                <li key={v.id} className="rounded-brand border border-zinc-200 p-3 text-sm">
                  <span className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wider">{v.plate}</span>
                  <p className="mt-2 font-medium">{[v.make, v.model, v.version].filter(Boolean).join(' ') || 'Modèle non renseigné'}</p>
                  <p className="text-zinc-600">
                    {[
                      v.firstRegistration && `MEC ${formatDay(v.firstRegistration)}`,
                      v.fuel && fuelLabels[v.fuel],
                      v.gearbox && gearboxLabels[v.gearbox],
                      v.mileage !== null && `${v.mileage.toLocaleString('fr-FR')} km`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {v.missingDetails.length > 0 && <p className="mt-1 text-xs text-amber-700">À compléter : {v.missingDetails.join(', ')}</p>}
                  <button type="button" onClick={() => setPanel({ kind: 'vehicle', vehicle: v })} className="mt-2 text-xs font-semibold text-primary hover:underline">
                    {v.missingDetails.length > 0 ? 'Compléter' : 'Modifier'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-brand bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Devis</h2>
          <button
            type="button"
            disabled={vehicles.length === 0}
            title={vehicles.length === 0 ? "Le client n'a pas de véhicule" : undefined}
            onClick={() => setPanel({ kind: 'quote' })}
            className="rounded-brand bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary disabled:opacity-40"
          >
            + Nouveau devis
          </button>
        </div>
        {quotes.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">Aucun devis.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">N°</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Véhicule</th>
                  <th className="py-2 pr-3">Garage</th>
                  <th className="py-2 pr-3 text-right">Total HT</th>
                  <th className="py-2 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td className="py-2 pr-3">
                      <Link to={`/devis/${q.id}`} className="font-mono font-semibold hover:underline">
                        {q.number}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{date.format(new Date(q.createdAt))}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{q.vehiclePlate}</td>
                    <td className="py-2 pr-3 text-zinc-600">{q.garageName}</td>
                    <td className="py-2 pr-3 text-right">{euro.format(q.totalHt)}</td>
                    <td className="py-2 text-right font-medium">{euro.format(q.totalTtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-brand bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Factures</h2>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">Aucune facture.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">N°</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Véhicule</th>
                  <th className="py-2 pr-3">Garage</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3 text-right">Total HT</th>
                  <th className="py-2 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 pr-3">
                      <Link to={`/factures/${i.id}`} className="font-mono font-semibold hover:underline">
                        {i.number}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{date.format(new Date(i.issuedAt))}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{i.vehiclePlate}</td>
                    <td className="py-2 pr-3 text-zinc-600">{i.garageName}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invoiceStatusClasses[i.status.id]}`}>{i.status.label}</span>
                    </td>
                    <td className="py-2 pr-3 text-right">{euro.format(i.totalHt)}</td>
                    <td className="py-2 text-right font-medium">{euro.format(i.totalTtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {panel?.kind === 'customer' && <EditCustomerPanel customer={customer} onClose={() => setPanel(null)} onSaved={saved} />}
      {panel?.kind === 'vehicle' && (
        <SidePanel title="Informations du véhicule" subtitle={panel.vehicle.plate} onClose={() => setPanel(null)}>
          <VehicleDetailsForm vehicle={panel.vehicle} onCancel={() => setPanel(null)} onSaved={saved} />
        </SidePanel>
      )}
      {panel?.kind === 'quote' && (
        <NewQuotePanel customerId={customer.id} vehicles={vehicles} catalog={catalog} onClose={() => setPanel(null)} />
      )}
    </>
  )
}
