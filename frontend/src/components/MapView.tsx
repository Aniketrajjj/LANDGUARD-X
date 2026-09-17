import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { LocationSummary, RiskLevel } from '../types'
import { RISK_COLORS, riskLabel } from './RiskBadge'
import { computeRisk } from '../utils/riskEngine'
import { RAW_LOCATIONS } from '../data/locations'
import { Incident } from '../types'

interface ZonePoint {
  location: LocationSummary
  score: number
  level: RiskLevel
}

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lon], map.getZoom() < 8 ? 9 : map.getZoom(), { duration: 0.6 })
  }, [lat, lon])
  return null
}

export default function MapView({
  selectedId,
  onSelect,
  incidents = [],
  height = 460,
}: {
  selectedId: string
  onSelect: (id: string) => void
  incidents?: Incident[]
  height?: number
}) {
  const [zones, setZones] = useState<ZonePoint[]>([])

  useEffect(() => {
    // Uses local deterministic engine directly for instant map rendering
    // (mirrors backend scoring 1:1; see src/utils/riskEngine.ts)
    const z = RAW_LOCATIONS.map((loc) => {
      const risk = computeRisk(loc)
      return {
        location: { id: loc.id, name: loc.name, state: loc.state, lat: loc.lat, lon: loc.lon },
        score: risk.score,
        level: risk.level,
      }
    })
    setZones(z)
  }, [])

  const selected = zones.find((z) => z.location.id === selectedId)
  const center: [number, number] = selected ? [selected.location.lat, selected.location.lon] : [31.5, 78]

  return (
    <div className="relative rounded-xl overflow-hidden border border-base-600" style={{ height }}>
      <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }} zoomControl={true}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {selected && <Recenter lat={selected.location.lat} lon={selected.location.lon} />}

        {zones.map((z) => (
          <CircleMarker
            key={z.location.id}
            center={[z.location.lat, z.location.lon]}
            radius={z.location.id === selectedId ? 16 : 11}
            pathOptions={{
              color: RISK_COLORS[z.level],
              fillColor: RISK_COLORS[z.level],
              fillOpacity: z.location.id === selectedId ? 0.55 : 0.35,
              weight: z.location.id === selectedId ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(z.location.id) }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <div className="font-semibold text-sm">{z.location.name}</div>
                <div className="text-xs text-base-300 mb-1">{z.location.state}</div>
                <div className="text-sm font-mono" style={{ color: RISK_COLORS[z.level] }}>
                  {z.score}/100 &middot; {riskLabel(z.level)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {incidents.map((inc) => {
          const loc = RAW_LOCATIONS.find((l) => l.id === inc.location_id)
          if (!loc) return null
          return (
            <CircleMarker
              key={inc.id}
              center={[loc.lat + 0.02, loc.lon + 0.02]}
              radius={6}
              pathOptions={{ color: '#ffffff', fillColor: '#0f141c', fillOpacity: 1, weight: 2, dashArray: '2,2' }}
            >
              <Popup>
                <div className="text-sm font-semibold">{inc.id}</div>
                <div className="text-xs text-base-300">{inc.type}</div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <div className="absolute bottom-3 left-3 bg-base-800/95 border border-base-600 rounded-lg px-3 py-2 text-[11px] space-y-1 z-[1000]">
        <div className="font-semibold text-base-200 mb-1">Risk Legend</div>
        {(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'CRITICAL'] as RiskLevel[]).map((lvl) => (
          <div key={lvl} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[lvl] }} />
            <span className="text-base-300">{riskLabel(lvl)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
