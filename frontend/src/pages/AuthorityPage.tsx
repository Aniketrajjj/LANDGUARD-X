import { useEffect, useState } from 'react'
import { getAnalytics, getIncidents, dispatchIncident } from '../services/api'
import { AnalyticsPayload, Incident } from '../types'
import { RISK_COLORS, riskLabel } from '../components/RiskBadge'
import { computeRisk } from '../utils/riskEngine'
import { RAW_LOCATIONS } from '../data/locations'
import { Siren, AlertTriangle, Users, Activity, TrendingUp, TrendingDown, Minus, Truck } from 'lucide-react'
import { useAppState } from '../hooks/useAppState'
import { useNavigate } from 'react-router-dom'

const TrendIcon = { increasing: TrendingUp, decreasing: TrendingDown, stable: Minus } as const

export default function AuthorityPage() {
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const { setSelectedLocationId } = useAppState()
  const navigate = useNavigate()

  useEffect(() => {
    getAnalytics().then(setAnalytics)
    getIncidents().then(setIncidents)
  }, [])

  async function handleDispatch(id: string) {
    await dispatchIncident(id)
    const updated = await getIncidents()
    setIncidents(updated)
  }

  const priorityZones = RAW_LOCATIONS
    .map((loc) => {
      const risk = computeRisk(loc)
      return { loc, risk }
    })
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 7)

  const recommendation = (score: number) => {
    if (score >= 86) return 'Evacuation Preparation'
    if (score >= 71) return 'Road Inspection'
    if (score >= 51) return 'Monitor'
    return 'Routine'
  }

  const summaryCards = analytics ? [
    { label: 'ACTIVE ALERTS', value: analytics.summary.active_alerts, icon: AlertTriangle, color: '#f97316' },
    { label: 'CRITICAL ZONES', value: analytics.summary.critical_zones, icon: Siren, color: '#dc2626' },
    { label: 'HIGH-RISK ZONES', value: analytics.summary.high_risk_zones, icon: Activity, color: '#ef4444' },
    { label: 'OPEN INCIDENTS', value: analytics.summary.open_incidents, icon: Truck, color: '#3b9eff' },
    { label: 'PEOPLE POTENTIALLY EXPOSED', value: analytics.summary.population_exposed.toLocaleString(), icon: Users, color: '#8896a5' },
  ] : []

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-base-100">Authority Command Center</h2>
        <p className="text-sm text-base-400">Regional landslide risk monitoring & response coordination</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <Icon size={16} style={{ color }} className="mb-2" />
            <div className="text-2xl font-mono font-bold text-base-100">{value}</div>
            <div className="text-[10px] text-base-400 mt-1 tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-base-100 mb-3">Priority Zones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-base-400 border-b border-base-600/60">
                <th className="py-2 pr-4 font-medium">Zone</th>
                <th className="py-2 pr-4 font-medium">Risk</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 pr-4 font-medium">Population</th>
                <th className="py-2 pr-4 font-medium">Infrastructure</th>
                <th className="py-2 pr-4 font-medium">Trend</th>
                <th className="py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {priorityZones.map(({ loc, risk }) => {
                const Trend = TrendIcon[loc.trend]
                return (
                  <tr
                    key={loc.id}
                    onClick={() => { setSelectedLocationId(loc.id); navigate('/map') }}
                    className="border-b border-base-700/60 last:border-0 cursor-pointer hover:bg-base-700/30"
                  >
                    <td className="py-2.5 pr-4 font-medium text-base-100">{loc.name}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: RISK_COLORS[risk.level], background: `${RISK_COLORS[risk.level]}1a` }}>
                        {riskLabel(risk.level)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{risk.score}</td>
                    <td className="py-2.5 pr-4 font-mono">{loc.population_exposed.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-base-300">{loc.nearby_infrastructure}</td>
                    <td className="py-2.5 pr-4">
                      <Trend size={14} className={loc.trend === 'increasing' ? 'text-risk-high' : loc.trend === 'decreasing' ? 'text-risk-low' : 'text-base-400'} />
                    </td>
                    <td className="py-2.5 text-accent text-xs font-medium">{recommendation(risk.score)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-base-100 mb-3">Active Incidents</h3>
        <div className="space-y-3">
          {incidents.filter((i) => i.status !== 'RESOLVED').map((inc) => (
            <div key={inc.id} className="bg-base-700/40 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-accent">{inc.id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                    color: inc.severity === 'CRITICAL' ? '#dc2626' : inc.severity === 'HIGH' ? '#f97316' : '#eab308',
                    background: inc.severity === 'CRITICAL' ? '#dc262620' : inc.severity === 'HIGH' ? '#f9731620' : '#eab30820',
                  }}>{inc.severity}</span>
                  <span className="text-[11px] text-base-400">{inc.reported_minutes_ago}m ago</span>
                </div>
                <div className="text-sm font-medium text-base-100">{inc.type} — {inc.location_name}</div>
                <div className="text-xs text-base-400 mt-0.5">{inc.description}</div>
                <div className="text-xs text-base-300 mt-1">People affected: <span className="font-mono">{inc.people_affected.toLocaleString()}</span> &middot; Status: <span className="text-accent">{inc.status}</span></div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setSelectedLocationId(inc.location_id || 'dharamshala'); navigate('/map') }} className="text-xs px-3 py-1.5 rounded-lg bg-base-800 border border-base-600 hover:border-accent text-base-200">
                  View on Map
                </button>
                <button
                  onClick={() => handleDispatch(inc.id)}
                  disabled={inc.status === 'RESPONSE DISPATCHED'}
                  className="text-xs px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-dim text-white font-medium disabled:opacity-50"
                >
                  {inc.status === 'RESPONSE DISPATCHED' ? 'Dispatched' : 'Dispatch Team'}
                </button>
              </div>
            </div>
          ))}
          {incidents.filter((i) => i.status !== 'RESOLVED').length === 0 && (
            <div className="text-sm text-base-400 text-center py-6">No active incidents.</div>
          )}
        </div>
      </div>
    </div>
  )
}
