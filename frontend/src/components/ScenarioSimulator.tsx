import { useEffect, useState } from 'react'
import { SlidersHorizontal, ArrowRight } from 'lucide-react'
import { calculateScenario } from '../services/api'
import { ScenarioResult } from '../types'
import RiskBadge from './RiskBadge'
import { RAW_LOCATIONS } from '../data/locations'

export default function ScenarioSimulator({ locationId }: { locationId: string }) {
  const base = RAW_LOCATIONS.find((l) => l.id === locationId) ?? RAW_LOCATIONS[0]
  const [rainfall, setRainfall] = useState(base.rainfall_mm)
  const [soil, setSoil] = useState(base.soil_moisture_pct)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRainfall(base.rainfall_mm)
    setSoil(base.soil_moisture_pct)
  }, [locationId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    calculateScenario(locationId, rainfall, soil).then((r) => {
      if (!cancelled) { setResult(r); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [locationId, rainfall, soil])

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={15} className="text-accent" />
        <h3 className="text-sm font-semibold text-base-100">What-If Risk Simulator</h3>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-base-300">Rainfall</span>
            <span className="font-mono text-base-100">{rainfall} mm</span>
          </div>
          <input
            type="range" min={0} max={300} value={rainfall}
            onChange={(e) => setRainfall(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-base-300">Soil Moisture</span>
            <span className="font-mono text-base-100">{soil}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={soil}
            onChange={(e) => setSoil(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      {result && (
        <div className="bg-base-700/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-[11px] text-base-400 mb-1">Current Risk</div>
              <div className="text-xl font-mono font-bold text-base-100">{result.current.score}</div>
              <RiskBadge level={result.current.level} size="sm" />
            </div>
            <ArrowRight size={18} className="text-base-400" />
            <div className="text-center">
              <div className="text-[11px] text-base-400 mb-1">Scenario Risk</div>
              <div className={`text-xl font-mono font-bold ${loading ? 'opacity-50' : ''}`} style={{ color: result.change >= 0 ? '#f97316' : '#22c55e' }}>
                {result.scenario.score}
              </div>
              <RiskBadge level={result.scenario.level} size="sm" />
            </div>
          </div>
          <div className="text-center text-xs font-medium pt-2 border-t border-base-600/60" style={{ color: result.change >= 0 ? '#f97316' : '#22c55e' }}>
            Risk Change: {result.change >= 0 ? '+' : ''}{result.change}
          </div>
          <p className="text-[11px] text-base-400 text-center leading-relaxed">
            {result.change > 5
              ? 'Increased rainfall and saturation substantially raise estimated slope-failure risk.'
              : result.change < -5
                ? 'Reduced rainfall and saturation notably ease estimated slope-failure risk.'
                : 'These conditions have a limited effect on the current risk estimate.'}
          </p>
        </div>
      )}
    </div>
  )
}
