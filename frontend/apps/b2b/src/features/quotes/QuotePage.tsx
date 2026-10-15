import { ApiError, QuoteApiRepository } from '@atelio/core/data'
import { SendQuote, VAT_RATE, type GarageQuote } from '@atelio/core/domain'
import { useState } from 'react'
import { Link } from 'react-router'
import { useBrand } from '../../brand/useBrand'
import { useDeferredData } from '../../components/DeferredRoute'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const qty = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const date = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * Devis imprimable (A4), comme la facture : prix HT, TVA, TTC.
 * Il s'imprime (ou s'enregistre en PDF) depuis le navigateur, ou s'envoie par e-mail au client.
 */
export default function QuotePage() {
  const quote = useDeferredData<GarageQuote>()
  const { brand, api } = useBrand()
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const vehicle = [quote.vehicleMake, quote.vehicleModel, quote.vehicleVersion].filter(Boolean).join(' ')

  async function send() {
    setSending(true)
    setMessage(null)
    try {
      await new SendQuote(new QuoteApiRepository(api)).execute(quote.id)
      setMessage({ ok: true, text: `Devis envoyé à ${quote.customerEmail}.` })
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError && err.status < 500 ? err.message : "L'envoi a échoué, réessayez." })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/clients/${quote.customerId}`} className="text-sm text-zinc-500 hover:underline">
          ← {quote.customerFirstName} {quote.customerLastName}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={sending || !quote.customerEmail}
            title={quote.customerEmail ? undefined : "Le client n'a pas d'adresse e-mail"}
            onClick={send}
            className="rounded-brand border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold hover:border-primary disabled:opacity-40"
          >
            {sending ? 'Envoi…' : 'Envoyer par e-mail'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-brand bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary"
          >
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      </div>

      {message && (
        <p role="status" className={`no-print mb-4 rounded-brand px-3 py-2 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}

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
            <p className="text-2xl font-extrabold tracking-tight">DEVIS</p>
            <p className="font-mono font-semibold">{quote.number}</p>
            <p className="mt-1 text-zinc-600">Date : {date.format(new Date(quote.createdAt))}</p>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Client</p>
            <p className="mt-1 font-semibold">
              {quote.customerFirstName} {quote.customerLastName}
            </p>
            {quote.customerPhone && <p>{quote.customerPhone}</p>}
            {quote.customerEmail && <p>{quote.customerEmail}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Véhicule</p>
            <p className="mt-1 font-mono font-semibold">{quote.vehiclePlate}</p>
            {vehicle && <p>{vehicle}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Garage</p>
            <p className="mt-1 font-semibold">
              {brand.name} {quote.garageName}
            </p>
            <p>{quote.garageAddress}</p>
            {quote.garagePhone && <p>{quote.garagePhone}</p>}
          </div>
        </section>

        <table data-plain className="mt-8 w-full">
          <thead className="border-b-2 border-zinc-800 text-left text-xs uppercase tracking-wider">
            <tr>
              <th className="py-2">Désignation</th>
              <th className="py-2 text-right">Qté</th>
              <th className="py-2 text-right">PU HT</th>
              <th className="py-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l, i) => (
              <tr key={i} className="border-b border-zinc-100 align-top">
                <td className="py-1.5">
                  <span className="font-semibold">{l.name}</span>
                  {l.description && <p className="whitespace-pre-line text-xs text-zinc-600">{l.description}</p>}
                </td>
                <td className="py-1.5 text-right">{qty.format(l.quantity)}</td>
                <td className="py-1.5 text-right">{euro.format(l.unitPriceHt)}</td>
                <td className="py-1.5 text-right">{euro.format(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-72 space-y-1">
            <div className="flex justify-between">
              <dt>Total HT</dt>
              <dd>{euro.format(quote.totalHt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>TVA {VAT_RATE * 100} %</dt>
              <dd>{euro.format(quote.totalVat)}</dd>
            </div>
            <div className="flex justify-between border-t-2 border-zinc-800 pt-1 text-base font-bold">
              <dt>Total TTC</dt>
              <dd>{euro.format(quote.totalTtc)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-zinc-600">Devis gratuit. Bon pour accord : date et signature du client.</p>

        <footer className="mt-10 border-t border-zinc-200 pt-3 text-center text-xs text-zinc-500">
          {brand.legal.companyName} · capital {brand.legal.capital} · {brand.legal.rcs} · SIRET {brand.legal.siret} · TVA{' '}
          {brand.legal.vatNumber}
        </footer>
      </article>
    </>
  )
}
