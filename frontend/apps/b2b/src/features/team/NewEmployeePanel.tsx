import { ApiError, TeamApiRepository } from '@atelio/core/data'
import { AddTeamMember, ValidationError, type EmployeeRole } from '@atelio/core/domain'
import { useState, type FormEvent } from 'react'
import { useBrand } from '../../brand/useBrand'
import SidePanel from '../../components/SidePanel'
import { roleLabels } from './TeamLabels'

const input = 'w-full rounded-brand border border-zinc-300 px-3 py-2 outline-none focus:border-primary'

/** Ajout d'un employé au garage, pour le planning ; son planning type se saisit juste après. */
export default function NewEmployeePanel({
  garageId,
  garageName,
  onClose,
  onAdded,
}: {
  garageId: number
  garageName: string
  onClose: () => void
  /** Employé ajouté : la page ouvre son planning. */
  onAdded: (employeeId: number) => void
}) {
  const { api } = useBrand()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<EmployeeRole>('mechanic')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const id = await new AddTeamMember(new TeamApiRepository(api)).execute(garageId, { firstName, lastName, role, phone, email })
      onAdded(id)
    } catch (err) {
      setError(err instanceof ValidationError || (err instanceof ApiError && err.status < 500) ? err.message : "L'enregistrement a échoué, réessayez.")
      setBusy(false)
    }
  }

  return (
    <SidePanel
      title="Nouvel employé"
      subtitle={`Ajouté à l'équipe de ${garageName}. Son planning type se saisit ensuite.`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-brand border border-zinc-300 px-4 py-2 text-sm font-semibold">
            Annuler
          </button>
          <button
            type="submit"
            form="employee-form"
            disabled={busy}
            className="rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
      }
    >
      <form id="employee-form" onSubmit={submit} className="space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block font-semibold">Prénom</span>
            <input autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Indiquez le prénom" maxLength={100} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold">Nom</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Indiquez le nom" maxLength={100} className={input} />
          </label>
        </div>
        <fieldset>
          <legend className="mb-1 font-semibold">Rôle</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(roleLabels) as EmployeeRole[]).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={role === r}
                onClick={() => setRole(r)}
                className={`rounded-brand border px-4 py-2 font-semibold ${role === r ? 'border-primary bg-primary text-on-primary' : 'border-zinc-300 hover:border-primary'}`}
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>
          <span className="mt-1 block text-xs text-zinc-500">Les mécaniciens présents donnent la capacité du garage pour les rendez-vous.</span>
        </fieldset>
        <label className="block">
          <span className="mb-1 block font-semibold">Téléphone (facultatif)</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Indiquez le téléphone" maxLength={30} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">E-mail (facultatif)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Indiquez l'e-mail" maxLength={255} className={input} />
        </label>
        {error && <p className="rounded-brand bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      </form>
    </SidePanel>
  )
}
