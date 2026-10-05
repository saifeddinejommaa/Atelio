import type { ApiClient } from '@atelio/core/data'
import type { Brand } from '@atelio/core/domain'
import { createContext } from 'react'

export type BrandContextValue = { brand: Brand; api: ApiClient }

/** Marque du domaine courant et son client API, fournis à toute l'app (voir main.tsx). */
export const BrandContext = createContext<BrandContextValue | null>(null)
