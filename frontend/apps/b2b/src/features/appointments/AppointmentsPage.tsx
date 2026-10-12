import type { Appointment } from '@atelio/core/domain'
import type { CalendarRef } from '@fullcalendar/react'
import { useEffect, useRef, useState } from 'react'
import { useLoaderData } from 'react-router'
import { useCurrentGarage } from '../../garage/useCurrentGarage'
import AppointmentDetailPanel from './AppointmentDetailPanel'
import { calendarLegend, LOCKED_BACKGROUND, MIN_LEAD_HOURS } from './AppointmentStatus'
import type { AppointmentsData } from './AppointmentsLoader'
import AppointmentsCalendar from './AppointmentsCalendar'
import NewAppointmentPanel from './NewAppointmentPanel'

export default function AppointmentsPage() {
  const garage = useCurrentGarage()
  const { services: allServices, appointmentStatuses, interventionStatuses } = useLoaderData<AppointmentsData>()
  const services = allServices.filter((s) => garage.serviceCodes.includes(s.code))
  const legend = [
    ...calendarLegend(appointmentStatuses, interventionStatuses),
    { label: `Plus réservable (moins de ${MIN_LEAD_HOURS} h)`, color: LOCKED_BACKGROUND },
  ]
  const calendarRef = useRef<CalendarRef>(null)
  // Créneau cliqué : ouvre le panneau de création.
  const [newStart, setNewStart] = useState<Date | null>(null)
  // Rendez-vous cliqué : ouvre le panneau de détail.
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    if (!confirmation) return
    const timer = setTimeout(() => setConfirmation(''), 5000)
    return () => clearTimeout(timer)
  }, [confirmation])

  /** Après une création ou une modification : on ferme le panneau et on recharge le calendrier. */
  function done(message: string) {
    setNewStart(null)
    setSelected(null)
    setConfirmation(message)
    calendarRef.current?.getApi().refetchEvents()
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Rendez-vous</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cliquez sur un créneau pour ajouter un rendez-vous, ou sur un rendez-vous pour le voir.
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs text-zinc-600">
          {legend.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span
                className={`h-3 w-3 rounded-sm ${s.color === LOCKED_BACKGROUND ? 'ring-1 ring-inset ring-zinc-300' : ''}`}
                style={{ background: s.color }}
              />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="brand-calendar mt-6 rounded-brand bg-white p-4 shadow-sm">
        {/* Nouveau garage : le calendrier repart de zéro et recharge ses rendez-vous. */}
        <AppointmentsCalendar
          key={garage.id}
          garage={garage}
          calendarRef={calendarRef}
          onSlotClick={setNewStart}
          onAppointmentClick={setSelected}
        />
      </div>

      {newStart && (
        <NewAppointmentPanel
          key={newStart.getTime()}
          garage={garage}
          services={services}
          start={newStart}
          onClose={() => setNewStart(null)}
          onBooked={(reference) => done(`Rendez-vous ${reference} enregistré.`)}
        />
      )}

      {selected && (
        <AppointmentDetailPanel key={selected.id} appointment={selected} onClose={() => setSelected(null)} onChanged={done} />
      )}

      {confirmation && (
        <p role="status" className="fixed bottom-6 right-6 z-50 rounded-brand bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {confirmation}
        </p>
      )}
    </>
  )
}
