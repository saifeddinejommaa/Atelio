import { AppointmentApiRepository, GarageApiRepository } from '@atelio/core/data'
import {
  appointmentDisplayStatus,
  GetGarageAppointments,
  GetGarageCapacity,
  type Appointment,
  type CapacityPeriod,
  type Garage,
} from '@atelio/core/domain'
import FullCalendar, {
  type CalendarRef,
  type DateClickInfo,
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
import { useCallback, useMemo, useRef, type Ref } from 'react'
import { useBrand } from '../../brand/use-brand'
import { displayColors } from './appointment-status'

// Options fixes, définies une fois pour que FullCalendar ne se reconfigure pas à chaque rendu.
const plugins = [timeGridPlugin, interactionPlugin, classicThemePlugin]
const headerToolbar = { start: 'prev,next today', center: 'title', end: '' }
const renderEvent = (info: EventDisplayInfo) => <AppointmentEvent info={info} />
// Fond des demi-heures d'ouverture : orange s'il reste des places, rouge sinon.
const OPEN_COLOR = '#f59e0b'
const FULL_COLOR = '#ef4444'

/** "2026-10-05" à partir d'une date locale. */
function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}


function vehicleLabel(a: Appointment): string {
  return [a.vehicleMake, a.vehicleModel, a.vehiclePlate].filter(Boolean).join(' ')
}

export default function AppointmentsCalendar({
  garage,
  calendarRef,
  onSlotClick,
  onAppointmentClick,
}: {
  garage: Garage
  calendarRef: Ref<CalendarRef>
  /** Clic sur un créneau à venir. */
  onSlotClick: (start: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
}) {
  const { api } = useBrand()

  // FullCalendar demande les rendez-vous de la période affichée (fin exclue).
  const loadEvents = useCallback(async (info: EventSourceFuncInfo): Promise<EventInput[]> => {
    const from = isoDay(info.start)
    const to = isoDay(new Date(info.end.getTime() - 1))
    const appointments = await new GetGarageAppointments(new AppointmentApiRepository(api)).execute(garage.id, from, to)

    return appointments.map((a) => ({
      id: String(a.id),
      start: a.scheduledAt,
      end: a.estimatedEndAt,
      title: `${a.customerFirstName} ${a.customerLastName}`,
      ...displayColors(appointmentDisplayStatus(a)),
      className: 'appointment-event',
      extendedProps: { appointment: a },
    }))
  }, [api, garage.id])

  // Places par demi-heure : orange s'il en reste, rouge sinon (non cliquable).
  const capacity = useRef<CapacityPeriod[]>([])
  const loadCapacity = useCallback(async (info: EventSourceFuncInfo): Promise<EventInput[]> => {
    const from = isoDay(info.start)
    const to = isoDay(new Date(info.end.getTime() - 1))
    capacity.current = await new GetGarageCapacity(new GarageApiRepository(api)).execute(garage.id, from, to)

    return capacity.current
      .map((p) => ({
        start: p.start,
        end: p.end,
        display: 'background',
        color: p.free > 0 ? OPEN_COLOR : FULL_COLOR,
      }))
  }, [api, garage.id])

  const eventSources = useMemo(() => [loadEvents, loadCapacity], [loadEvents, loadCapacity])

  // Pas de rendez-vous dans le passé, ni sur une plage complète.
  const slotClick = useCallback(
    (info: DateClickInfo) => {
      const time = info.date.getTime()
      const full = capacity.current.some(
        (p) => p.free === 0 && new Date(p.start).getTime() <= time && time < new Date(p.end).getTime(),
      )
      if (info.date > new Date() && !full) onSlotClick(info.date)
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

  // Jours de fermeture masqués (garage : 1 = lundi ... 7 = dimanche ; calendrier : 0 = dimanche).
  const hiddenDays = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].filter((d) => !garage.openDays.includes(d === 0 ? 7 : d)),
    [garage.openDays],
  )

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={plugins}
      locale={frLocale}
      initialView="timeGridWeek"
      headerToolbar={headerToolbar}
      firstDay={1}
      hiddenDays={hiddenDays}
      slotMinTime={garage.openingTime}
      slotMaxTime={garage.closingTime}
      allDaySlot={false}
      nowIndicator
      height="auto"
      eventSources={eventSources}
      eventContent={renderEvent}
      dateClick={slotClick}
      eventClick={appointmentClick}
    />
  )
}

function AppointmentEvent({ info }: { info: EventDisplayInfo }) {
  const appointment = info.event.extendedProps.appointment as Appointment | undefined
  // Fond de capacité : pas de contenu.
  if (!appointment) return null
  return (
    <div className="overflow-hidden px-1 py-0.5 text-xs leading-tight" title={`${info.event.title} · ${vehicleLabel(appointment)}`}>
      <span className="font-semibold">{info.timeText}</span> <span className="font-semibold">{info.event.title}</span>
      <div className="truncate opacity-90">{vehicleLabel(appointment)}</div>
    </div>
  )
}
