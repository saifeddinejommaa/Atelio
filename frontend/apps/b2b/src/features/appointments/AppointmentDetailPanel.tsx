import { ApiError, AppointmentApiRepository } from '@atelio/core/data'
import {
  AbandonAppointment,
  appointmentDisplayStatus,
  canMarkNoShow,
  canReschedule,
  canStart,
  isOpen,
  RescheduleAppointment,
  ValidationError,
  type AbandonStatus,
  type Appointment,
} from '@atelio/core/domain'
import { useState } from 'react'
import { Link } from 'react-router'
import { useBrand } from '../../brand/use-brand'
import SidePanel from '../../components/SidePanel'
import SlotCheckMessage from './SlotCheckMessage'
import StartAppointmentForm from './StartAppointmentForm'
import { useSlotCheck } from './use-slot-check'
import { appointmentStatuses } from './appointment-status'

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Valeur d'un champ datetime-local (heure du navigateur) : "2026-10-12T09:30". */
function toInputValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message
  if (error instanceof ApiError && error.status < 500) return error.message
  return "L'action a échoué. Vérifiez que l'API est démarrée puis réessayez."
}

export default function AppointmentDetailPanel({
  appointment: a,
  onClose,
  onChanged,
}: {
  appointment: Appointment
  onClose: () => void
  /** Rendez-vous modifié (heure ou abandon) : message à afficher. */
  onChanged: (message: string) => void
}) {
  const { api } = useBrand()
  const repository = new AppointmentApiRepository(api)

  const [newStart, setNewStart] = useState(toInputValue(a.scheduledAt))
  const [confirmAbandon, setConfirmAbandon] = useState<AbandonStatus | null>(null)
  // Formulaire de lancement ouvert (heure réelle de début, vérification).
  const [launching, setLaunching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Nouvelle date choisie : disponibilité vérifiée avec la durée du rendez-vous, sans le compter lui-même.
  const changed = canReschedule(a) && newStart !== toInputValue(a.scheduledAt)
  const slotCheck = useSlotCheck(changed ? { garageId: a.garageId, scheduledAt: newStart, excludeAppointment: a.reference } : null)

  const status = appointmentStatuses[appointmentDisplayStatus(a)]
  const vehicle = [a.vehicleMake, a.vehicleModel].filter(Boolean).join(' ')

  async function run(action: () => Promise<void>) {
    setError('')
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const reschedule = () =>
    run(async () => {
      await new RescheduleAppointment(repository).execute(a.reference, newStart)
      onChanged(`Rendez-vous ${a.reference} déplacé.`)
    })

  const abandon = (choice: AbandonStatus) =>
    run(async () => {
      await new AbandonAppointment(repository).execute(a.reference, choice)
      onChanged(choice === 'no_show' ? `Client noté absent (${a.reference}).` : `Rendez-vous ${a.reference} annulé.`)
    })


  return (
    <SidePanel
      title={`${a.customerFirstName} ${a.customerLastName}`}
      subtitle={
        <span className="flex items-center gap-2">
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: status.color, color: status.contrastColor }}>
            {status.label}
          </span>
          <span className="font-mono text-xs text-zinc-500">{a.reference}</span>
        </span>
      }
      onClose={onClose}
      footer={
        isOpen(a) && launching ? (
          <StartAppointmentForm appointment={a} onCancel={() => setLaunching(false)} />
        ) : isOpen(a) ? (
          <div className="space-y-3">
            {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {canStart(a) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setLaunching(true)}
                className="w-full rounded-brand bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary disabled:opacity-40"
              >
                Lancer l'intervention
              </button>
            )}
            {confirmAbandon ? (
              <div className="rounded-brand border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">
                  {confirmAbandon === 'no_show' ? 'Noter le client comme absent ?' : 'Annuler ce rendez-vous ?'}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => abandon(confirmAbandon)}
                    className="rounded-brand bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Confirmer
                  </button>
                  <button type="button" onClick={() => setConfirmAbandon(null)} className="rounded-brand border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold">
                    Retour
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAbandon('cancelled')}
                  className="flex-1 rounded-brand border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-red-600 hover:text-red-700"
                >
                  Annuler le rendez-vous
                </button>
                {canMarkNoShow(a) && (
                  <button
                    type="button"
                    onClick={() => setConfirmAbandon('no_show')}
                    className="flex-1 rounded-brand border border-zinc-300 px-3 py-2 text-sm font-semibold hover:border-red-600 hover:text-red-700"
                  >
                    Client non venu
                  </button>
                )}
              </div>
            )}
          </div>
        ) : a.interventionId !== null ? (
          <Link
            to={`/interventions/${a.interventionId}`}
            className="block w-full rounded-brand bg-secondary px-5 py-2.5 text-center text-sm font-semibold text-on-secondary"
          >
            Voir l'intervention
          </Link>
        ) : undefined
      }
    >
      <Section title="Client">
        <p className="font-semibold">
          {a.customerFirstName} {a.customerLastName}
        </p>
        {a.customerPhone && (
          <a href={`tel:${a.customerPhone.replace(/\s/g, '')}`} className="block text-sm text-zinc-600 hover:underline">
            {a.customerPhone}
          </a>
        )}
        {a.customerEmail && <p className="text-sm text-zinc-600">{a.customerEmail}</p>}
      </Section>

      <Section title="Véhicule">
        <p>
          <span className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-sm font-semibold tracking-wider">{a.vehiclePlate}</span>
          {vehicle && <span className="ml-2 text-sm text-zinc-600">{vehicle}</span>}
        </p>
      </Section>

      <Section title="Heure">
        <p className="first-letter:uppercase">
          {dayFormat.format(new Date(a.scheduledAt))}, {timeFormat.format(new Date(a.scheduledAt))} –{' '}
          {timeFormat.format(new Date(a.estimatedEndAt))}
        </p>
        {canReschedule(a) && (
          <div className="mt-3 flex gap-2">
            <input
              type="datetime-local"
              step={1800}
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              aria-label="Nouvelle date et heure"
              className="min-w-0 flex-1 rounded-brand border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={busy || slotCheck.status !== 'available'}
              onClick={reschedule}
              className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
            >
              Modifier
            </button>
          </div>
        )}
        <SlotCheckMessage check={slotCheck} />
      </Section>

      <Section title="Intervention demandée">
        <ul className="space-y-1">
          {a.serviceNames.map((name) => (
            <li key={name} className="text-sm">
              • {name}
            </li>
          ))}
        </ul>
        {a.customerNotes && (
          <p className="mt-3 whitespace-pre-line rounded-brand bg-muted px-3 py-2 text-sm text-zinc-700">{a.customerNotes}</p>
        )}
      </Section>
    </SidePanel>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}
