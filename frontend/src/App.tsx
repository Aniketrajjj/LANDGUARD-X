import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Overview from './pages/Overview'
import RiskMapPage from './pages/RiskMapPage'
import ForecastPage from './pages/ForecastPage'
import CitizenPage from './pages/CitizenPage'
import AuthorityPage from './pages/AuthorityPage'
import IncidentsPage from './pages/IncidentsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { AppStateContext } from './hooks/useAppState'
import { getLocations, isBackendReachable } from './services/api'
import { LocationSummary } from './types'
import { DEFAULT_LOCATION_ID } from './data/locations'

export default function App() {
  const [locations, setLocations] = useState<LocationSummary[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState(DEFAULT_LOCATION_ID)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    getLocations().then((locs) => {
      setLocations(locs)
      setOffline(!isBackendReachable())
    })
  }, [])

  return (
    <AppStateContext.Provider value={{ locations, selectedLocationId, setSelectedLocationId, offline }}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Overview />} />
            <Route path="/map" element={<RiskMapPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/citizen" element={<CitizenPage />} />
            <Route path="/authority" element={<AuthorityPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateContext.Provider>
  )
}
