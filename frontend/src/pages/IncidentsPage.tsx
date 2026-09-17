import { useEffect, useState } from 'react'
import { getIncidents, dispatchIncident, updateIncidentStatus } from '../services/api'
import { Incident } from '../types'
import { Ambulance, Hospital, Home, MapPinned, CheckCircle2 } from 'lucide-react'

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#dc2626', HIGH: '#f97316', MODERATE: '#eab308', LOW: '#22c55e',
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [dispatchInfo, setDispatchInfo] = useState<Record<string, any>>({})

  useEffect(() => { load() }, [])
  async function load() { setIncidents(await getIncidents()) }

  async function handleDispatch(id: string) {
    const res = await dispatchIncident(id)
    setDispatchInfo((prev) => ({ ...prev, [id]: res }))
    load()
  }

  async function handleResolve(id: string) {
    await updateIncidentStatus(id, 'RESOLVED')
    load()
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-base-100">Incidents</h2>
        <p className="text-sm text-base-400">Full incident timeline and emergency response tracking</p>
      </div>

      <div className="space-y-4">
        {incidents.map((inc) => {
          const info = dispatchInfo[inc.id]
          return (
            <div key={inc.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-sm text-accent font-semibold">INCIDENT {inc.id}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: SEVERITY_COLOR[inc.severity], background: `${SEVERITY_COLOR[inc.severity]}20` }}>
                  {inc.severity}
                </span>
                <span className="text-xs text-base-400 ml-auto">{inc.reported_minutes_ago === 0 ? 'Just now' : `${inc.reported_minutes_ago} minutes ago`}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-[11px] text-base-400">Location</div>
                  <div className="text-sm font-medium text-base-100">{inc.location_name}</div>
                </div>
                <div>
                  <div className="text-[11px] text-base-400">Type</div>
                  <div className="text-sm font-medium text-base-100">{inc.type}</div>
                </div>
                <div>
                  <div className="text-[11px] text-base-400">People Affected</div>
                  <div className="text-sm font-mono font-medium text-base-100">{inc.people_affected.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[11px] text-base-400">Status</div>
                  <div className="text-sm font-medium text-accent">{inc.status}</div>
                </div>
              </div>

              <p className="text-sm text-base-300 mb-4">{inc.description}</p>

              {info && (
                <div className="bg-base-700/50 rounded-lg p-4 mb-4 fade-in">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-base-100">
                    <Ambulance size={16} className="text-accent" /> Response Team &middot; ETA {info.response_team_eta_minutes} min
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-2"><Hospital size={14} className="text-base-400" /> Nearest Hospital: <span className="font-mono">{info.nearest_hospital_km} km</span></div>
                    <div className="flex items-center gap-2"><Home size={14} className="text-base-400" /> Nearest Shelter: <span className="font-mono">{info.nearest_shelter_km} km</span></div>
                    <div className="flex items-center gap-2"><MapPinned size={14} className="text-base-400" /> Road Access: {info.road_access}</div>
                  </div>
                  <div className="text-[11px] text-base-400 mb-1.5">Recommended:</div>
                  <ul className="text-xs text-base-300 list-disc list-inside space-y-0.5">
                    {info.recommended_actions.map((a: string) => <li key={a}>{a}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDispatch(inc.id)}
                  disabled={inc.status === 'RESPONSE DISPATCHED' || inc.status === 'RESOLVED'}
                  className="text-xs px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-dim text-white font-medium disabled:opacity-50"
                >
                  Dispatch Team
                </button>
                <button
                  onClick={() => handleResolve(inc.id)}
                  disabled={inc.status === 'RESOLVED'}
                  className="text-xs px-3 py-1.5 rounded-lg bg-base-800 border border-base-600 hover:border-risk-low text-base-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={13} /> Mark Resolved
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
