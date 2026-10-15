import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLoaderData } from 'react-router'
import { themeStyle } from '../brand/BrandTheme'
import { markAppReady, type Deferred } from '../lib/deferred'
import type { StaffMember } from '@atelio/core/domain'
import { useBrand } from '../brand/useBrand'
import GarageSwitcher from '../garage/GarageSwitcher'
import type { GaragesData } from '../garage/GaragesLoader'
import type { CurrentGarageContext } from '../garage/useCurrentGarage'
import { useDeferredResult } from './DeferredRoute'
import LoadingState from './LoadingState'
import TechnicalError from './TechnicalError'

const links = [
  { to: '/rendez-vous', label: 'Rendez-vous' },
  { to: '/interventions', label: 'Interventions' },
  { to: '/factures', label: 'Factures' },
  { to: '/clients', label: 'Clients' },
  { to: '/articles', label: 'Articles' },
  { to: '/prestations', label: 'Prestations' },
  { to: '/promotions', label: 'Promotions' },
  { to: '/equipes', label: 'Équipes' },
]

const roleLabels: Record<StaffMember['role'], string> = { admin: 'Admin', staff: 'Staff' }

const LAST_GARAGE_KEY = 'last-garage'

/**
 * Cadre de l'espace pro. Tout ce que le front connaît déjà (marque, menu, compte Microsoft, déconnexion)
 * s'affiche tout de suite ; seul le contenu attend la personne connectée et ses garages (API),
 * et affiche l'erreur technique à sa place en cas de souci.
 */
export default function Layout() {
  const { brand, accountName, signOut } = useBrand()
  const result = useDeferredResult(useLoaderData<Deferred<GaragesData>>())
  const [garageId, setGarageId] = useState(() => readLastGarage())
  const data = result.status === 'ok' ? result.value : null
  const staff = data?.staff ?? null
  const garage = data?.garages.find((g) => g.id === garageId) ?? data?.garages[0]

  // Démarrage terminé : les rechargements de page gardent désormais leurs données affichées (voir deferred).
  useEffect(() => markAppReady(), [])

  function changeGarage(id: number) {
    setGarageId(id)
    saveLastGarage(id)
  }

  return (
    <div style={themeStyle(brand)} className="flex min-h-screen bg-muted font-sans text-foreground">
      {/* Menu fixe à l'écran : seul le contenu de la page défile. */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto bg-primary px-4 py-6 text-on-primary">
        <div className="flex items-center gap-3 px-3">
          <img src={brand.logo} alt="" className="h-9 w-auto rounded-brand" />
          <div>
            <p className="font-extrabold leading-tight tracking-tight">{brand.name}</p>
            <p className="text-xs text-on-primary/70">Espace pro</p>
          </div>
        </div>
        {data && garage && (
          <GarageSwitcher garages={data.garages} companyGarageCount={data.companyGarageCount} value={garage} onChange={changeGarage} />
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
        <div className="mt-auto border-t border-white/15 px-3 pt-4 text-sm">
          <p className="font-semibold">{staff ? `${staff.firstName} ${staff.lastName}` : accountName}</p>
          {staff && <p className="text-xs text-on-primary/70">{roleLabels[staff.role]}</p>}
          <button type="button" onClick={() => void signOut()} className="mt-2 text-xs text-on-primary/80 underline hover:text-on-primary">
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">
        {result.status === 'loading' ? (
          <LoadingState message="Chargement de l'espace pro…" />
        ) : result.status === 'error' ? (
          <TechnicalError error={result.error} />
        ) : !staff ? (
          // Compte Microsoft valide mais pas employé de cette marque.
          <div className="mx-auto mt-16 max-w-md rounded-brand bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-extrabold tracking-tight">Accès refusé</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Le compte <strong>{accountName}</strong> n&apos;est relié à aucun employé actif de {brand.name}. Demandez au responsable de
              la marque de vous attribuer un rôle Atelio et d&apos;ajouter votre e-mail à votre fiche employé.
            </p>
            <button type="button" onClick={() => void signOut()} className="mt-6 rounded-brand bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
              Changer de compte
            </button>
          </div>
        ) : garage ? (
          <Outlet context={{ garage, staff } satisfies CurrentGarageContext} />
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
