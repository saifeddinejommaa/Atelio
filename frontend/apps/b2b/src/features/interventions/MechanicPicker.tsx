import { ApiError, InterventionApiRepository } from '@atelio/core/data'
import { AssignInterventionEmployee, InterventionStatus, type Intervention, type Mechanic } from '@atelio/core/domain'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { useBrand } from '../../brand/use-brand'

/** Mécanicien chargé de l'intervention : par défaut le moins chargé, modifiable tant qu'elle n'est pas close. */
export default function MechanicPicker({ intervention, mechanics }: { intervention: Intervention; mechanics: Mechanic[] }) {
  const { api } = useBrand()
  const revalidator = useRevalidator()
  const [selected, setSelected] = useState(intervention.employeeId ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const closed = intervention.status.id !== InterventionStatus.Planned && intervention.status.id !== InterventionStatus.InProgress
  const changed = selected !== 0 && selected !== intervention.employeeId

  async function save() {
    setError('')
    setSaving(true)
    try {
      await new AssignInterventionEmployee(new InterventionApiRepository(api)).execute(intervention.id, selected)
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof ApiError && err.status < 500 ? err.message : "L'enregistrement a échoué, réessayez.")
    } finally {
      setSaving(false)
    }
  }

  if (closed) {
    return (
      <p className="font-semibold">
        {intervention.employeeId ? `${intervention.employeeFirstName} ${intervention.employeeLastName}` : 'Non affecté'}
      </p>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <select
          aria-label="Mécanicien chargé"
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="min-w-0 flex-1 rounded-brand border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {!intervention.employeeId && <option value={0}>— Choisir un mécanicien —</option>}
          {mechanics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!changed || saving}
          onClick={save}
          className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
        >
          {saving ? '…' : 'Changer'}
        </button>
      </div>
      {error && <p className="mt-2 rounded-brand bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </>
  )
}
