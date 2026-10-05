import { useContext } from 'react'
import { BrandContext, type BrandContextValue } from './BrandContext'

export function useBrand(): BrandContextValue {
  const value = useContext(BrandContext)
  if (!value) throw new Error('useBrand doit être utilisé sous BrandContext (voir main.tsx).')
  return value
}
