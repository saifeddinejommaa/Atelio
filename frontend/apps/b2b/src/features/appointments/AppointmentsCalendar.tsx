import { AppointmentApiRepository, GarageApiRepository } from '@atelio/core/data'
import {
  appointmentDisplayStatus,
  AppointmentStatus,
  GetGarageAppointments,
  GetGarageCapacity,
  type Appointment,
  type CapacityPeriod,
  type Garage,
} from '@atelio/core/domain'
import FullCalendar, {
  type CalendarRef,
  type DateClickInfo,
  type DatesSetInfo,
  type EventClickInfo,
  type EventDisplayInfo,
  type EventInput,
  type EventSourceFuncInfo,
} from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/react/interaction'
import frLocale from '@fullcalendar/react/locales/fr'
import classicThemePlugin from '@fullcalendar/react/themes/classic'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'
import { useCallback, useMemo, useRef, useState, type RefObject } from 'react'
import { useBrand } from '../../brand/useBrand'
import { displayColors, MIN_LEAD_HOURS } from './AppointmentStatus'

type ViewType = 'timeGridDay' | 'timeGridWeek'

// Options fixes, définies une fois pour que FullCalendar ne se reconfigure pas à chaque rendu.
const plugins = [timeGridPlugin, interactionPlugin, classicThemePlugin]
const renderEvent = (info: EventDisplayInfo) => <AppointmentEvent info={info} />
// Fond des demi-heures : rien s'il reste une place, rouge pâle si complet, gris sans mécanicien (pause).
const FULL_COLOR = '#ef4444'
const CLOSED_COLOR = '#a1a1aa'

const stripDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })

/** "2026-10-05" à partir d'une date locale. */
function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Lundi (00:00, heure locale) de la semaine de la date. */
function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

/** Premier instant réservable : maintenant + MIN_LEAD_HOURS. */
function firstBookable(): Date {
  return new Date(Date.now() + MIN_LEAD_HOURS * 3_600_000)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function vehicleLabel(a: Appointment): string {
  return [a.vehicleMake, a.vehicleModel, a.vehiclePlate].filter(Boolean).join(' ')
}

/** Rendez-vous comptés par jour (annulés exclus). */
function countByDay(appointments: Appointment[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const a of appointments) {
    if (a.status.id === AppointmentStatus.Cancelled) continue
    const day = isoDay(new Date(a.scheduledAt))
    counts[day] = (counts[day] ?? 0) + 1
  }
  return counts
}

/** Jours sans aucune place : toutes les demi-heures avec un mécanicien présent sont prises. */
function fullDays(periods: CapacityPeriod[]): Set<string> {
  const byDay = new Map<string, CapacityPeriod[]>()
  for (const p of periods.filter((p) => p.total > 0)) {
    const day = isoDay(new Date(p.start))
    byDay.set(day, [...(byDay.get(day) ?? []), p])
  }
  return new Set([...byDay].filter(([, list]) => list.every((p) => p.free === 0)).map(([day]) => day))
}

/**
 * Calendrier des rendez-vous du garage. Vue jour par défaut (bande des jours de la semaine
 * avec leur nombre de rendez-vous), vue semaine pour l'ensemble.
 */
export default function AppointmentsCalendar({
  garage,
  calendarRef,
  onSlotClick,
  onAppointmentClick,
}: {
  garage: Garage
  calendarRef: RefObject<CalendarRef | null>
  /** Clic sur un créneau à venir. */
  onSlotClick: (start: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
}) {
  const { api } = useBrand()
  const [view, setView] = useState<{
    type: ViewType
    title: string
    date: Date
  }>(() => ({
    type: 'timeGridDay',
    title: '',
    date: new Date(),
  }))
  // Jour courant, mis en avant dans la bande des jours.
  const [today] = useState(() => isoDay(new Date()))
  // Données de la semaine affichée (bande des jours) : nombre de rendez-vous et jours complets.
  const [week, setWeek] = useState<{
    start: string
    counts: Record<string, number>
    full: Set<string>
  }>({
    start: '',
    counts: {},
    full: new Set(),
  })

  // La semaine entière est chargée, même en vue jour, pour la bande des jours.
  const loadEvents = useCallback(
    async (info: EventSourceFuncInfo): Promise<EventInput[]> => {
      const monday = mondayOf(info.start)
      const appointments = await new GetGarageAppointments(new AppointmentApiRepository(api)).execute(
        garage.id,
        isoDay(monday),
        isoDay(addDays(monday, 6)),
      )
      const counts = countByDay(appointments)
      setWeek((w) => ({ ...w, start: isoDay(monday), counts }))

      return appointments.map((a) => ({
        id: String(a.id),
        start: a.scheduledAt,
        end: a.estimatedEndAt,
        title: `${a.customerFirstName} ${a.customerLastName}`,
        ...displayColors(appointmentDisplayStatus(a)),
        className: 'appointment-event',
        extendedProps: { appointment: a },
      }))
    },
    [api, garage.id],
  )

  const capacity = useRef<CapacityPeriod[]>([])
  const loadCapacity = useCallback(
    async (info: EventSourceFuncInfo): Promise<EventInput[]> => {
      const monday = mondayOf(info.start)
      capacity.current = await new GetGarageCapacity(new GarageApiRepository(api)).execute(
        garage.id,
        isoDay(monday),
        isoDay(addDays(monday, 6)),
      )
      const full = fullDays(capacity.current)
      setWeek((w) => ({ ...w, full }))

      // Avant le premier instant réservable : une seule bande hachurée (index.css), sans les fonds de capacité.
      const lockedUntil = firstBookable()
      const locked: EventInput[] =
        lockedUntil > monday ? [{ start: monday, end: lockedUntil, display: 'background', className: 'slot-locked' }] : []

      return [
        ...locked,
        ...capacity.current
          .filter((p) => p.free === 0 && new Date(p.end) > lockedUntil)
          .map((p) => ({
            start: new Date(Math.max(new Date(p.start).getTime(), lockedUntil.getTime())),
            end: p.end,
            display: 'background',
            color: p.total > 0 ? FULL_COLOR : CLOSED_COLOR,
          })),
      ]
    },
    [api, garage.id],
  )

  const eventSources = useMemo(() => [loadEvents, loadCapacity], [loadEvents, loadCapacity])

  // Pas de rendez-vous dans le passé, ni sur une plage complète.
  const slotClick = useCallback(
    (info: DateClickInfo) => {
      const time = info.date.getTime()
      const full = capacity.current.some((p) => p.free === 0 && new Date(p.start).getTime() <= time && time < new Date(p.end).getTime())
      if (info.date >= firstBookable() && !full) onSlotClick(info.date)
    },
    [onSlotClick],
  )

  const appointmentClick = useCallback(
    (info: EventClickInfo) => {
      const appointment = info.event.extendedProps.appointment as Appointment | undefined
      if (appointment) onAppointmentClick(appointment)
    },
    [onAppointmentClick],
  )

  const datesSet = useCallback((info: DatesSetInfo) => {
    setView({
      type: info.view.type as ViewType,
      title: info.view.title,
      date: info.view.currentStart,
    })
  }, [])

  // Jours de fermeture masqués (garage : 1 = lundi ... 7 = dimanche ; calendrier : 0 = dimanche).
  const hiddenDays = useMemo(() => [0, 1, 2, 3, 4, 5, 6].filter((d) => !garage.openDays.includes(d === 0 ? 7 : d)), [garage.openDays])

  const calendar = () => calendarRef.current?.getApi()
  const monday = mondayOf(view.date)
  const stripDays = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(monday, i)).filter((d) => !hiddenDays.includes(d.getDay()))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Précédent" onClick={() => calendar()?.prev()} className={navButton}>
            ‹
          </button>
          <button type="button" aria-label="Suivant" onClick={() => calendar()?.next()} className={navButton}>
            ›
          </button>
          <button type="button" onClick={() => calendar()?.today()} className={`${navButton} px-3 text-sm`}>
            Aujourd'hui
          </button>
          <h2 className="ml-2 text-lg font-bold first-letter:uppercase">{view.title}</h2>
        </div>
        <div className="flex rounded-brand bg-muted p-1 text-sm font-semibold">
          {(
            [
              ['timeGridDay', 'Jour'],
              ['timeGridWeek', 'Semaine'],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              aria-pressed={view.type === type}
              onClick={() => calendar()?.changeView(type)}
              className={`rounded-brand px-4 py-1.5 ${view.type === type ? 'bg-primary text-on-primary' : 'text-zinc-600 hover:bg-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bande des jours : la journée choisie s'affiche sur toute la largeur. */}
      {view.type === 'timeGridDay' && (
        <div
          className="mb-4 grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${stripDays.length}, minmax(0, 1fr))`,
          }}
        >
          {stripDays.map((d) => {
            const day = isoDay(d)
            const selected = day === isoDay(view.date)
            const count = week.start === isoDay(monday) ? (week.counts[day] ?? 0) : null
            const full = week.full.has(day)
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                onClick={() => calendar()?.gotoDate(d)}
                className={`rounded-brand border px-2 py-2 text-center transition-colors ${
                  selected ? 'border-primary bg-primary text-on-primary' : 'border-zinc-200 bg-white hover:border-primary'
                }`}
              >
                <span className="block text-xs first-letter:uppercase opacity-80">{stripDay.format(d)}</span>
                <span className={`block text-lg font-bold ${day === today && !selected ? 'text-primary' : ''}`}>{d.getDate()}</span>
                <span className={`block text-xs ${full && !selected ? 'font-semibold text-red-700' : 'opacity-80'}`}>
                  {count === null ? '…' : full ? 'Complet' : `${count} RDV`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* En vue jour, la colonne du jour courant n'est pas teintée : la journée reste blanche. */}
      <div className={view.type === 'timeGridDay' ? 'calendar-day-view' : undefined}>
        <FullCalendar
          ref={calendarRef}
          plugins={plugins}
          locale={frLocale}
          initialView="timeGridDay"
          headerToolbar={false}
          firstDay={1}
          hiddenDays={hiddenDays}
          slotMinTime={garage.openingTime}
          slotMaxTime={garage.closingTime}
          allDaySlot={false}
          // Vue jour : le jour est déjà indiqué par la bande des jours, pas d'en-tête de colonne.
          dayHeaders={view.type === 'timeGridWeek'}
          // Demi-heure assez haute pour l'heure, le client et le véhicule ; rendez-vous simultanés côte à côte.
          slotMinHeight={44}
          slotEventOverlap={false}
          nowIndicator
          height="auto"
          eventSources={eventSources}
          eventContent={renderEvent}
          dateClick={slotClick}
          eventClick={appointmentClick}
          datesSet={datesSet}
        />
      </div>
    </>
  )
}

const navButton =
  'flex h-9 min-w-9 items-center justify-center rounded-brand border border-zinc-300 bg-white font-semibold hover:border-primary'

function AppointmentEvent({ info }: { info: EventDisplayInfo }) {
  const appointment = info.event.extendedProps.appointment as Appointment | undefined
  // Fond de capacité : pas de contenu.
  if (!appointment) return null
  return (
    <div className="overflow-hidden px-1.5 py-0.5 text-xs leading-tight" title={`${info.event.title} · ${vehicleLabel(appointment)}`}>
      <span className="font-semibold">{info.timeText}</span> <span className="font-semibold">{info.event.title}</span>
      <div className="truncate opacity-90">
        {vehicleLabel(appointment)}
        {appointment.serviceNames.length > 0 && ` · ${appointment.serviceNames.join(', ')}`}
      </div>
    </div>
  )
}
