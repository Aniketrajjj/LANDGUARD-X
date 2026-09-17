import { useEffect, useState } from 'react'
import { getAnalytics } from '../services/api'
import { AnalyticsPayload } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { RISK_COLORS } from '../components/RiskBadge'

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#dc2626', HIGH: '#f97316', MODERATE: '#eab308', LOW: '#22c55e',
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null)

  useEffect(() => { getAnalytics().then(setData) }, [])

  if (!data) return <div className="text-base-400 text-sm py-20 text-center">Loading analytics...</div>

  const severityData = Object.entries(data.severity_breakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-base-100">Analytics</h2>
        <p className="text-sm text-base-400">Regional risk trends, incidents, and exposure</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Active Alerts" value={data.summary.active_alerts} />
        <StatCard label="Critical Zones" value={data.summary.critical_zones} />
        <StatCard label="High-Risk Zones" value={data.summary.high_risk_zones} />
        <StatCard label="Open Incidents" value={data.summary.open_incidents} />
        <StatCard label="Citizen Reports" value={data.reports_total} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-sm font-semibold text-base-100 mb-3">Risk Score by Zone</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.zone_scores} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#28323f" vertical={false} />
              <XAxis dataKey="name" stroke="#5c6b7c" fontSize={11} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} stroke="#5c6b7c" fontSize={11} />
              <Tooltip contentStyle={{ background: '#151c27', border: '1px solid #28323f', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {data.zone_scores.map((z, i) => (
                  <Cell key={i} fill={RISK_COLORS[z.level]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-base-100 mb-3">Incidents by Severity</h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {severityData.map((d, i) => <Cell key={i} fill={SEVERITY_COLOR[d.name] ?? '#3b9eff'} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#151c27', border: '1px solid #28323f', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-base-400 text-center py-16">No incidents recorded yet.</div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-base-100 mb-3">Population Exposure</h3>
        <div className="text-3xl font-mono font-bold text-base-100">{data.summary.population_exposed.toLocaleString()}</div>
        <p className="text-xs text-base-400 mt-1">Total population potentially exposed across all monitored zones</p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-mono font-bold text-base-100">{value}</div>
      <div className="text-[11px] text-base-400 mt-1">{label}</div>
    </div>
  )
}
