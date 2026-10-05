import { interventionTotals, VAT_RATE, type Intervention } from '@atelio/core/domain'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

/** Récapitulatif : prestations + pièces = total TTC, dont TVA, et montant HT. */
export default function TotalsCard({ intervention }: { intervention: Intervention }) {
  const totals = interventionTotals(intervention)

  return (
    <section className="rounded-brand bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Récapitulatif</h2>
      <dl className="mt-3 space-y-1.5 text-sm">
        <Row label="Prestations (main-d'œuvre)" value={totals.labour} />
        <Row label="Pièces et fournitures" value={totals.parts} />
        <div className="flex items-baseline justify-between border-t border-zinc-200 pt-2 text-base font-bold">
          <dt>Total TTC</dt>
          <dd>{euro.format(totals.ttc)}</dd>
        </div>
        <div className="flex justify-between text-zinc-500">
          <dt>dont TVA {VAT_RATE * 100} %</dt>
          <dd>{euro.format(totals.vat)}</dd>
        </div>
        <div className="flex justify-between text-zinc-500">
          <dt>Total HT</dt>
          <dd>{euro.format(totals.ht)}</dd>
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
