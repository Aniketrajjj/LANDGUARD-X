import { createContext, useContext } from 'react'
import { LocationSummary } from '../types'

export interface AppStateShape {
  locations: LocationSummary[]
  selectedLocationId: string
  setSelectedLocationId: (id: string) => void
  offline: boolean
}

export const AppStateContext = createContext<AppStateShape | null>(null)

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateContext.Provider')
  return ctx
}
