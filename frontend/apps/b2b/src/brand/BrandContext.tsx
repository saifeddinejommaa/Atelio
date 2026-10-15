import type { ApiClient } from '@atelio/core/data'
import type { Brand } from '@atelio/core/domain'
import { createContext } from 'react'

export type BrandContextValue = {
  brand: Brand
  api: ApiClient
  /** Nom du compte Microsoft connecté. */
  accountName: string
  /** Déconnexion Microsoft, puis retour à l'écran de connexion. */
  signOut: () => Promise<void>
}

/** Marque du domaine courant, son client API et la session du personnel (voir main.tsx). */
export const BrandContext = createContext<BrandContextValue | null>(null)
