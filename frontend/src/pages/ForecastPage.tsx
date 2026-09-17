import { useEffect, useState } from 'react'
import { useAppState } from '../hooks/useAppState'
import { getForecast } from '../services/api'
import { ForecastPayload } from '../types'
import ForecastChartWidget from '../components/ForecastChartWidget'
import ScenarioSimulator from '../components/ScenarioSimulator'
import RiskBadge from '../components/RiskBadge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const TrendIcon = { increasing: TrendingUp, decreasing: TrendingDown, stable: Minus } as const

export default function ForecastPage() {
  const { selectedLocationId, locations } = useAppState()
  const [forecast, setForecast] = useState<ForecastPayload | null>(null)

  useEffect(() => {
    getForecast(selectedLocationId).then(setForecast)
  }, [selectedLocationId])

  const loc = locations.find((l) => l.id === selectedLocationId)
  const Trend = forecast ? TrendIcon[forecast.trend] : Minus

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-base-100">{loc?.name} — 48-Hour Forecast</h2>
              <p className="text-xs text-base-400">Deterministic forecast derived from current conditions and trend</p>
            </div>
            {forecast && (
              <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: forecast.trend === 'increasing' ? '#f97316' : forecast.trend === 'decreasing' ? '#22c55e' : '#8896a5' }}>
                <Trend size={16} /> {forecast.trend.toUpperCase()}
              </div>
            )}
          </div>
          {forecast && <ForecastChartWidget data={forecast.forecast} />}
        </div>

        {forecast && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4">
              <div className="text-xs text-base-400 mb-1">Current</div>
              <div className="text-2xl font-mono font-bold text-base-100 mb-1">{forecast.current_score}</div>
              <RiskBadge level={forecast.current_level} size="sm" />
            </div>
            <div className="card p-4">
              <div className="text-xs text-base-400 mb-1">Forecast Peak (+{forecast.peak.hour}h)</div>
              <div className="text-2xl font-mono font-bold text-base-100 mb-1">{forecast.peak.score}</div>
              <RiskBadge level={forecast.peak.level} size="sm" />
            </div>
            <div className="card p-4">
              <div className="text-xs text-base-400 mb-1">Trend</div>
              <div className="text-2xl font-bold text-base-100 mb-1 capitalize">{forecast.trend}</div>
              <span className="text-[11px] text-base-400">Next 48 hours</span>
            </div>
          </div>
        )}

        {forecast && (
          <div className="card p-4">
            <p className="text-sm text-base-200 leading-relaxed">{forecast.message}</p>
          </div>
        )}

        {forecast && (
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-base-100 mb-3">Forecast Timeline</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {forecast.forecast.map((p) => (
                <div key={p.hour} className="bg-base-700/50 rounded-lg p-2.5 text-center">
                  <div className="text-[11px] text-base-400 mb-1">{p.hour === 0 ? 'NOW' : `+${p.hour}H`}</div>
                  <div className="text-lg font-mono font-bold text-base-100">{p.score}</div>
                  <RiskBadge level={p.level} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScenarioSimulator locationId={selectedLocationId} />
    </div>
  )
}
