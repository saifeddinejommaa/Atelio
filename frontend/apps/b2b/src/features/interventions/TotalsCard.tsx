import { interventionTotals, VAT_RATE, type Intervention } from '@atelio/core/domain'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** Récapitulatif des articles : total HT, TVA, total TTC (même calcul que la facture). */
export default function TotalsCard({ intervention }: { intervention: Intervention }) {
  const totals = interventionTotals(intervention)

  return (
    <section className="rounded-brand bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Récapitulatif</h2>
      <dl className="mt-3 space-y-1.5 text-sm">
        <Row label="Total HT" value={totals.ht} />
        <Row label={`TVA ${VAT_RATE * 100} %`} value={totals.vat} />
        <div className="flex items-baseline justify-between border-t border-zinc-200 pt-2 text-base font-bold">
          <dt>Total TTC</dt>
          <dd>{euro.format(totals.ttc)}</dd>
        </div>
      </dl>
    </section>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-600">{label}</dt>
      <dd>{euro.format(value)}</dd>
    </div>
  )
}
