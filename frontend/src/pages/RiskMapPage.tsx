import { useEffect, useState } from 'react'
import { useAppState } from '../hooks/useAppState'
import { getRisk, getIncidents } from '../services/api'
import { RiskPayload, Incident } from '../types'
import MapView from '../components/MapView'
import RiskBadge from '../components/RiskBadge'
import FactorBars from '../components/FactorBars'
import { RAW_LOCATIONS } from '../data/locations'
import { Users, Route, Home } from 'lucide-react'

export default function RiskMapPage() {
  const { selectedLocationId, setSelectedLocationId } = useAppState()
  const [risk, setRisk] = useState<RiskPayload | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    getRisk(selectedLocationId).then(setRisk)
  }, [selectedLocationId])

  useEffect(() => {
    getIncidents().then(setIncidents)
  }, [])

  const rawLoc = RAW_LOCATIONS.find((l) => l.id === selectedLocationId)

  const recommendation = (score: number) => {
    if (score >= 86) return 'Evacuation preparation + immediate road closure'
    if (score >= 71) return 'Road inspection + prepare warning'
    if (score >= 51) return 'Increase monitoring frequency'
    return 'Routine monitoring'
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 card p-3">
        <div className="flex items-center justify-between px-2 pb-2">
          <h2 className="text-sm font-semibold text-base-100">Risk Intelligence Map</h2>
          <span className="text-[11px] text-base-400">Click a zone to inspect details</span>
        </div>
        <MapView selectedId={selectedLocationId} onSelect={setSelectedLocationId} incidents={incidents} height={560} />
      </div>

      {risk && rawLoc && (
        <div className="card p-4 h-fit">
          <div className="text-xs text-base-400 mb-1">ZONE DETAILS</div>
          <h3 className="text-lg font-bold text-base-100 mb-2">{risk.location.name}</h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-mono font-bold text-base-100">{risk.risk.score}</span>
            <span className="text-base-400 mb-1">/100</span>
          </div>
          <RiskBadge level={risk.risk.level} />

          <div className="mt-4 pt-4 border-t border-base-600/60">
            <div className="text-xs font-semibold text-base-200 mb-2">Primary Drivers</div>
            <ul className="space-y-1.5">
              {risk.risk.primary_drivers.map((d) => (
                <li key={d.factor} className="text-xs text-base-300 flex items-center gap-1.5">
                  <span>{d.icon}</span> {d.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-base-600/60 space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-accent" />
              <span className="text-base-300">Population Exposed:</span>
              <span className="font-mono font-semibold ml-auto">{rawLoc.population_exposed.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Route size={14} className="text-accent" />
              <span className="text-base-300">Nearby Road:</span>
              <span className="font-semibold ml-auto text-right">{rawLoc.nearby_infrastructure}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Home size={14} className="text-accent" />
              <span className="text-base-300">Nearest Shelter:</span>
              <span className="font-mono font-semibold ml-auto">{rawLoc.nearest_shelter_km} km</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-base-600/60">
            <div className="text-xs font-semibold text-base-200 mb-1">Recommended Action</div>
            <div className="text-sm text-accent font-medium">{recommendation(risk.risk.score)}</div>
          </div>

          <div className="mt-4 pt-4 border-t border-base-600/60">
            <div className="text-xs font-semibold text-base-200 mb-2">Factor Contribution</div>
            <FactorBars risk={risk.risk} />
          </div>
        </div>
      )}
    </div>
  )
}
