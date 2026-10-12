import { ApiError, VehicleApiRepository } from '@atelio/core/data'
import {
  fuelLabels,
  gearboxLabels,
  UpdateVehicleDetails,
  ValidationError,
  type CustomerVehicle,
  type VehicleFuel,
  type VehicleGearbox,
} from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'

const input = 'w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary'

/** Aujourd'hui, "2026-10-08" (date locale) : borne de la date de mise en circulation. */
function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Informations du véhicule (carte grise) saisies par le garage avant l'entrée en atelier :
 * marque, modèle, version, 1re mise en circulation, énergie, boîte. Pré-rempli avec ce qui est connu.
 */
export default function VehicleDetailsForm({
  vehicle,
  onSaved,
  onCancel,
}: {
  vehicle: CustomerVehicle
  onSaved: () => void
  onCancel?: () => void
}) {
  const { api } = useBrand()
  const [make, setMake] = useState(vehicle.make ?? '')
  const [model, setModel] = useState(vehicle.model ?? '')
  const [version, setVersion] = useState(vehicle.version ?? '')
  const [firstRegistration, setFirstRegistration] = useState(vehicle.firstRegistration ?? '')
  const [fuel, setFuel] = useState<VehicleFuel | ''>(vehicle.fuel ?? '')
  const [gearbox, setGearbox] = useState<VehicleGearbox | ''>(vehicle.gearbox ?? '')
  const [weight, setWeight] = useState(vehicle.weightKg?.toString() ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await new UpdateVehicleDetails(new VehicleApiRepository(api)).execute(vehicle.id, {
        make,
        model,
        version,
        firstRegistration,
        fuel: fuel as VehicleFuel,
        gearbox: gearbox as VehicleGearbox,
        // "1 741" ou "1741" => 1741 ; vide => non renseigné.
        weightKg: weight.trim() === '' ? null : Number(weight.replace(/\s/g, '')),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-semibold">Marque</span>
          <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="PEUGEOT" maxLength={50} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Modèle</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="207" maxLength={80} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Version</span>
          <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="SW 1.6" maxLength={80} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">1re mise en circulation</span>
          <input
            type="date"
            min="1950-01-01"
            max={today()}
            value={firstRegistration}
            onChange={(e) => setFirstRegistration(e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Énergie</span>
          <select value={fuel} onChange={(e) => setFuel(e.target.value as VehicleFuel)} className={`${input} bg-white`}>
            <option value="" disabled>
              Choisir…
            </option>
            {Object.entries(fuelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="mb-1 font-semibold">Boîte de vitesses</legend>
          <div className="flex gap-2">
            {(Object.entries(gearboxLabels) as [VehicleGearbox, string][]).map(([value, label]) => (
              <label
                key={value}
                className={`flex-1 cursor-pointer rounded-brand border px-3 py-2 text-center ${gearbox === value ? 'border-primary bg-muted font-semibold' : 'border-zinc-300'}`}
              >
                <input type="radio" name="gearbox" value={value} checked={gearbox === value} onChange={() => setGearbox(value)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block">
          <span className="mb-1 block font-semibold">
            Poids (kg) <span className="font-normal text-zinc-500">· facultatif</span>
          </span>
          <input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="1 741" className={input} />
        </label>
      </div>

      {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-brand border border-zinc-300 px-4 py-2 font-semibold hover:border-primary">
            Annuler
          </button>
        )}
        <button type="submit" disabled={busy} className="rounded-brand bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-40">
          {busy ? 'Enregistrement…' : 'Enregistrer le véhicule'}
        </button>
      </div>
    </form>
  )
}
