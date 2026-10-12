import { InterventionStatus } from '@atelio/core/domain'
import { Link, useLoaderData } from 'react-router'
import ArticlesCard from './ArticlesCard'
import type { InterventionData } from './InterventionLoader'
import InterventionActions from './InterventionActions'
import { interventionStatusClasses } from './InterventionStatus'
import MechanicPicker from './MechanicPicker'
import TotalsCard from './TotalsCard'
import VehicleCard from './VehicleCard'

const day = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Détail d'une intervention : client, véhicule, mécanicien chargé, prestations demandées, articles, récapitulatif. */
export default function InterventionPage() {
  const { intervention, vehicle, mechanics, catalog, quotes } = useLoaderData<InterventionData>()
  // Facturée : les articles ne se modifient plus.
  const locked = intervention.status.id === InterventionStatus.Invoiced || intervention.status.id === InterventionStatus.Closed

  return (
    <>
      <Link to="/interventions" className="text-sm text-zinc-500 hover:underline">
        ← Interventions
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">Intervention n°{intervention.id}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${interventionStatusClasses[intervention.status.id]}`}>
              {intervention.status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            {intervention.garageName}
            {intervention.startedAt && (
              <>
                {' · '}
                <span className="first-letter:uppercase">
                  commencée {day.format(new Date(intervention.startedAt))} à {time.format(new Date(intervention.startedAt))}
                </span>
              </>
            )}
            {intervention.finishedAt
              ? ` · terminée à ${time.format(new Date(intervention.finishedAt))}`
              : intervention.estimatedEndAt && ` · fin estimée ${time.format(new Date(intervention.estimatedEndAt))}`}
            {intervention.appointmentReference && (
              <span className="font-mono text-xs text-zinc-500"> · {intervention.appointmentReference}</span>
            )}
          </p>
        </div>
        <InterventionActions intervention={intervention} />
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Client">
          <p className="font-semibold">
            {intervention.customerFirstName} {intervention.customerLastName}
          </p>
          {intervention.customerPhone && (
            <a href={`tel:${intervention.customerPhone.replace(/\s/g, '')}`} className="block text-sm text-zinc-600 hover:underline">
              {intervention.customerPhone}
            </a>
          )}
          {intervention.customerEmail && <p className="text-sm text-zinc-600">{intervention.customerEmail}</p>}
        </Card>

        <VehicleCard vehicle={vehicle} mileage={intervention.mileage} />

        <Card title="Mécanicien">
          <MechanicPicker key={intervention.employeeId ?? 0} intervention={intervention} mechanics={mechanics} />
          {intervention.employeeId === null && (
            <p className="mt-2 text-sm text-amber-700">Aucun mécanicien n'était libre au lancement : choisissez-en un.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Prestations demandées">
          {intervention.services.length > 0 ? (
            <ul className="list-inside list-disc text-sm">
              {intervention.services.map((s) => (
                <li key={s.serviceId}>{s.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">Aucune prestation.</p>
          )}
        </Card>

        <Card title="Message du client">
          {intervention.customerNotes ? (
            <p className="whitespace-pre-line text-sm">{intervention.customerNotes}</p>
          ) : (
            <p className="text-sm text-zinc-400">Aucun message.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[3fr_1fr]">
        <ArticlesCard intervention={intervention} catalog={catalog} quotes={quotes} readOnly={locked} />
        <TotalsCard intervention={intervention} />
      </div>
    </>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-brand bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
