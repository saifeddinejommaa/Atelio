import type { Garage } from '@atelio/core/domain'

/**
 * Garage en cours, en haut du menu :
 * - la société n'a qu'un garage : rien n'est affiché ;
 * - l'utilisateur n'a accès qu'à un garage : son nom, non modifiable ;
 * - il a accès à plusieurs garages : une liste pour changer.
 */
export default function GarageSwitcher({
  garages,
  companyGarageCount,
  value,
  onChange,
}: {
  garages: Garage[]
  companyGarageCount: number
  value: Garage
  onChange: (garageId: number) => void
}) {
  if (companyGarageCount <= 1) return null

  return (
    <div className="mt-6 px-3">
      <p className="text-xs font-medium uppercase tracking-wider text-on-primary/60">Garage</p>
      {garages.length > 1 ? (
        <select
          aria-label="Garage"
          value={value.id}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-1 w-full rounded-brand border border-white/20 bg-white/10 px-2 py-1.5 text-sm font-semibold text-on-primary"
        >
          {garages.map((g) => (
            <option key={g.id} value={g.id} className="text-zinc-900">
              {g.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-1 text-sm font-semibold">{value.name}</p>
      )}
    </div>
  )
}
