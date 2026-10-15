import { ApiError, InvoiceApiRepository } from '@atelio/core/data'
import { GenerateInvoicePdf, GetInvoicePdf, type Invoice } from '@atelio/core/domain'
import { useEffect, useState } from 'react'
import { useBrand } from '../../brand/useBrand'
import InvoiceDocument from './InvoiceDocument'
import LoadingState from '../../components/LoadingState'

const dateTime = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

type PdfState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; url: string }

/**
 * PDF stocké de la facture (Azure Blob Storage) : dernière édition par défaut, éditions précédentes au choix,
 * téléchargement. Une facture émise avant les PDF s'affiche en HTML, avec un bouton pour générer son PDF.
 */
export default function InvoicePdfViewer({
  invoice,
  height = 'calc(100vh - 9rem)',
  onChanged,
}: {
  invoice: Invoice
  /** Hauteur du lecteur PDF. */
  height?: string
  /** Après la génération d'un PDF : recharger la facture. */
  onChanged: () => void
}) {
  const { api } = useBrand()
  const latest = invoice.documents[0]?.version ?? null
  const [version, setVersion] = useState<number | null>(latest)
  const [result, setResult] = useState<{ key: string; state: PdfState } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Nouvelle édition (règlement) : on affiche la plus récente.
  const shown = version !== null && invoice.documents.some((d) => d.version === version) ? version : latest
  const key = `${invoice.id}|${shown}`

  useEffect(() => {
    if (shown === null) return
    let current = true
    let url: string | null = null
    new GetInvoicePdf(new InvoiceApiRepository(api))
      .execute(invoice.id, shown)
      .then((blob): PdfState => {
        if (!blob) return { status: 'error', message: 'Le PDF est introuvable dans le stockage.' }
        url = URL.createObjectURL(blob)
        return { status: 'ok', url }
      })
      .catch((): PdfState => ({ status: 'error', message: "Le PDF n'a pas pu être chargé." }))
      .then((state) => {
        if (current) setResult({ key, state })
      })
    return () => {
      current = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [api, invoice.id, shown, key])

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      await new GenerateInvoicePdf(new InvoiceApiRepository(api)).execute(invoice.id)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : 'La génération du PDF a échoué. Le stockage est-il démarré (Azurite en local) ?')
    } finally {
      setGenerating(false)
    }
  }

  // Facture émise avant les PDF : aperçu HTML, PDF à générer.
  if (shown === null) {
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <span className="text-sm text-zinc-500">Pas encore de PDF pour cette facture.</span>
          <button
            type="button"
            disabled={generating}
            onClick={generate}
            className="rounded-brand bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary disabled:opacity-40"
          >
            {generating ? 'Génération…' : 'Générer le PDF'}
          </button>
        </div>
        {error && <p className="mb-3 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <InvoiceDocument invoice={invoice} compact />
      </div>
    )
  }

  const state: PdfState = result?.key === key ? result.state : { status: 'loading' }
  const fileName = `${invoice.number}${invoice.documents.length > 1 ? `-v${shown}` : ''}.pdf`

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        {invoice.documents.length > 1 && (
          <select
            aria-label="Édition du PDF"
            value={shown}
            onChange={(e) => setVersion(Number(e.target.value))}
            className="rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {invoice.documents.map((d) => (
              <option key={d.version} value={d.version}>
                Édition n°{d.version} · {dateTime.format(new Date(d.createdAt))}
                {d.version === latest ? ' (à jour)' : ''}
              </option>
            ))}
          </select>
        )}
        {state.status === 'ok' && (
          <a href={state.url} download={fileName} className="rounded-brand bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary">
            Télécharger le PDF
          </a>
        )}
      </div>

      {state.status === 'loading' && <div className="rounded-brand bg-white shadow-sm">
          <LoadingState message="Chargement du PDF…" />
        </div>}
      {state.status === 'error' && <p className="rounded-brand bg-white px-4 py-6 text-sm text-red-700 shadow-sm">{state.message}</p>}
      {state.status === 'ok' && (
        <iframe title={`Facture ${invoice.number}`} src={state.url} style={{ height }} className="w-full rounded-brand border border-zinc-200 bg-white" />
      )}
    </div>
  )
}
