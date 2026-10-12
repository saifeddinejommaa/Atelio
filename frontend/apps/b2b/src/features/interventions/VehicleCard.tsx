import { fuelLabels, gearboxLabels, type CustomerVehicle } from '@atelio/core/domain'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import SidePanel from '../../components/SidePanel'
import VehicleDetailsForm from '../vehicles/VehicleDetailsForm'

const day = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** "2009-05-12" => "12/05/2009". */
function formatDay(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  return day.format(new Date(y, m - 1, d))
}

/** Carte Véhicule de l'intervention : identification (carte grise), modifiable par le garage. */
export default function VehicleCard({ vehicle, mileage }: { vehicle: CustomerVehicle; mileage: number | null }) {
  const revalidator = useRevalidator()
  const [editing, setEditing] = useState(false)
  const name = [vehicle.make, vehicle.model, vehicle.version].filter(Boolean).join(' ')

  return (
    <section className="rounded-brand bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Véhicule</h2>
        <button type="button" onClick={() => setEditing(true)} className="text-sm text-zinc-600 hover:underline">
          Modifier
        </button>
      </div>
      <div className="mt-3">
        <span className="rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-sm font-semibold tracking-wider">{vehicle.plate}</span>
        {name && <p className="mt-2 text-sm font-medium">{name}</p>}
        <dl className="mt-1 space-y-0.5 text-sm text-zinc-600">
          {vehicle.firstRegistration && <div>1re mise en circulation : {formatDay(vehicle.firstRegistration)}</div>}
          {(vehicle.fuel || vehicle.gearbox) && (
            <div>
              {[vehicle.fuel && fuelLabels[vehicle.fuel], vehicle.gearbox && `boîte ${gearboxLabels[vehicle.gearbox].toLowerCase()}`]
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}
          {vehicle.weightKg !== null && <div>Poids : {vehicle.weightKg.toLocaleString('fr-FR')} kg</div>}
          {mileage !== null && <div>{mileage.toLocaleString('fr-FR')} km</div>}
        </dl>
        {vehicle.missingDetails.length > 0 && (
          <p className="mt-2 text-sm text-amber-700">Informations manquantes : {vehicle.missingDetails.join(', ')}.</p>
        )}
      </div>

      {editing && (
        <SidePanel title="Informations du véhicule" subtitle={vehicle.plate} onClose={() => setEditing(false)}>
          <VehicleDetailsForm
            vehicle={vehicle}
            onCancel={() => setEditing(false)}
            onSaved={async () => {
              setEditing(false)
              await revalidator.revalidate()
            }}
          />
        </SidePanel>
      )}
    </section>
  )
}
