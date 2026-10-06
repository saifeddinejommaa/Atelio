import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLoaderData } from 'react-router'
import { applyBrandToDocument, themeStyle } from '../brand/brand-theme'
import { useBrand } from '../brand/use-brand'
import GarageSwitcher from '../garage/GarageSwitcher'
import type { GaragesData } from '../garage/garages-loader'
import type { CurrentGarageContext } from '../garage/use-current-garage'

const links = [
  { to: '/rendez-vous', label: 'Rendez-vous' },
  { to: '/interventions', label: 'Interventions' },
  { to: '/equipes', label: 'Équipes' },
]

const LAST_GARAGE_KEY = 'last-garage'

export default function Layout() {
  const { brand } = useBrand()
  const { garages, companyGarageCount } = useLoaderData<GaragesData>()
  const [garageId, setGarageId] = useState(() => readLastGarage())
  const garage = garages.find((g) => g.id === garageId) ?? garages[0]

  useEffect(() => applyBrandToDocument(brand), [brand])

  function changeGarage(id: number) {
    setGarageId(id)
    saveLastGarage(id)
  }

  return (
    <div style={themeStyle(brand)} className="flex min-h-screen bg-muted font-sans text-foreground">
      <aside className="flex w-60 shrink-0 flex-col bg-primary px-4 py-6 text-on-primary">
        <div className="flex items-center gap-3 px-3">
          <img src={brand.logo} alt="" className="h-9 w-auto rounded-brand" />
          <div>
            <p className="font-extrabold leading-tight tracking-tight">{brand.name}</p>
            <p className="text-xs text-on-primary/70">Espace pro</p>
          </div>
        </div>
        {garage && (
          <GarageSwitcher garages={garages} companyGarageCount={companyGarageCount} value={garage} onChange={changeGarage} />
        )}
        <nav className="mt-8 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-brand px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-secondary text-on-secondary' : 'text-on-primary/75 hover:bg-white/10 hover:text-on-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">
        {garage ? (
          <Outlet context={{ garage } satisfies CurrentGarageContext} />
        ) : (
          <p className="rounded-brand bg-white p-6 text-sm text-zinc-600 shadow-sm">
            Votre compte n&apos;a accès à aucun garage. Contactez votre responsable.
          </p>
        )}
      </main>
    </div>
  )
}

// Confort : on rouvre le dernier garage choisi sur ce poste.
function readLastGarage(): number | null {
  try {
    return Number(localStorage.getItem(LAST_GARAGE_KEY)) || null
  } catch {
    return null
  }
}

function saveLastGarage(id: number) {
  try {
    localStorage.setItem(LAST_GARAGE_KEY, String(id))
  } catch {
    // Stockage indisponible (navigation privée...) : sans conséquence.
  }
}
