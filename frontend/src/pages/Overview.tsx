import { useEffect, useState } from 'react'
import { MapPin, Clock, TrendingUp, TrendingDown, Minus, Users, Route, Home as HomeIcon } from 'lucide-react'
import { useAppState } from '../hooks/useAppState'
import { getRisk, getForecast, getWeather } from '../services/api'
import { RiskPayload, ForecastPayload, WeatherPayload } from '../types'
import RiskBadge, { RISK_COLORS } from '../components/RiskBadge'
import MapView from '../components/MapView'
import FactorBars from '../components/FactorBars'
import SusceptibilityCard from '../components/SusceptibilityCard'
import ForecastChartWidget from '../components/ForecastChartWidget'
import WeatherCard from '../components/WeatherCard'
import ScenarioSimulator from '../components/ScenarioSimulator'
import { RAW_LOCATIONS } from '../data/locations'

const TrendIcon = { increasing: TrendingUp, decreasing: TrendingDown, stable: Minus } as const

export default function Overview() {
  const { selectedLocationId, setSelectedLocationId } = useAppState()
  const [risk, setRisk] = useState<RiskPayload | null>(null)
  const [forecast, setForecast] = useState<ForecastPayload | null>(null)
  const [weather, setWeather] = useState<WeatherPayload | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getRisk(selectedLocationId),
      getForecast(selectedLocationId),
      getWeather(selectedLocationId),
    ]).then(([r, f, w]) => {
      if (cancelled) return
      setRisk(r); setForecast(f); setWeather(w); setLastUpdated(new Date())
    })
    return () => { cancelled = true }
  }, [selectedLocationId])

  const rawLoc = RAW_LOCATIONS.find((l) => l.id === selectedLocationId)
  const Trend = forecast ? TrendIcon[forecast.trend] : Minus

  if (!risk || !forecast || !weather) {
    return <div className="text-base-400 text-sm py-20 text-center">Loading risk intelligence...</div>
  }

  return (
    <div className="space-y-5">
      {/* Top summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-1">
          <div className="flex items-center gap-1.5 text-base-300 text-xs mb-1">
            <MapPin size={13} /> {risk.location.state}
          </div>
          <h2 className="text-2xl font-bold text-base-100 mb-3">{risk.location.name}</h2>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-5xl font-mono font-extrabold" style={{ color: RISK_COLORS[risk.risk.level] }}>
              {risk.risk.score}
            </span>
            <span className="text-base-400 text-lg mb-1.5">/100</span>
          </div>
          <RiskBadge level={risk.risk.level} size="lg" />
          <div className="flex items-center gap-1.5 text-xs text-base-400 mt-3">
            <Clock size={12} /> Last updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="card p-5 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-base-400 mb-1">Risk Trend</div>
              <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: forecast.trend === 'increasing' ? '#f97316' : forecast.trend === 'decreasing' ? '#22c55e' : '#8896a5' }}>
                <Trend size={20} /> {forecast.trend.toUpperCase()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-base-400 mb-1">Peak Forecast ({forecast.peak.hour === 0 ? 'now' : `+${forecast.peak.hour}h`})</div>
              <div className="text-lg font-semibold" style={{ color: RISK_COLORS[forecast.peak.level] }}>
                {forecast.peak.score}/100
              </div>
            </div>
          </div>
          <p className="text-sm text-base-300 leading-relaxed mt-4">{forecast.message}</p>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-base-600/60">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-accent" />
              <div>
                <div className="text-sm font-mono font-semibold">{rawLoc?.population_exposed.toLocaleString()}</div>
                <div className="text-[11px] text-base-400">Population Exposed</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Route size={15} className="text-accent" />
              <div>
                <div className="text-sm font-semibold truncate">{rawLoc?.nearby_infrastructure}</div>
                <div className="text-[11px] text-base-400">Nearby Infrastructure</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HomeIcon size={15} className="text-accent" />
              <div>
                <div className="text-sm font-mono font-semibold">{rawLoc?.nearest_shelter_km} km</div>
                <div className="text-[11px] text-base-400">Nearest Shelter</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map + explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-3">
          <div className="flex items-center justify-between px-2 pb-2">
            <h3 className="text-sm font-semibold text-base-100">Risk Intelligence Map</h3>
            <span className="text-[11px] text-base-400">Red zones indicate elevated landslide risk</span>
          </div>
          <MapView selectedId={selectedLocationId} onSelect={setSelectedLocationId} />
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-base-100">Explainable Risk Intelligence</h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                risk.risk.mode === 'hybrid_ml'
                  ? 'text-indigo-300 border-indigo-500/40 bg-indigo-500/10'
                  : 'text-base-400 border-base-600 bg-base-700/60'
              }`}
              title={
                risk.risk.mode === 'hybrid_ml'
                  ? 'Susceptibility term supplied by the trained Random Forest'
                  : 'Trained model unavailable — rule-based scoring only'
              }
            >
              {risk.risk.mode === 'hybrid_ml' ? 'ML + rules' : 'Rules only'}
            </span>
          </div>
          <p className="text-[11px] text-base-400 mb-4">Why is this location at risk?</p>
          <div className="space-y-3 mb-4">
            {risk.risk.primary_drivers.map((d) => (
              <div key={d.factor} className="flex gap-2.5">
                <span className="text-base leading-none mt-0.5">{d.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-base-100">{d.title}</div>
                  <div className="text-[11px] text-base-400">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <FactorBars risk={risk.risk} />
          <div className="mt-4">
            <SusceptibilityCard ml={risk.ml} />
          </div>
        </div>
      </div>

      {/* Forecast + weather + simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-sm font-semibold text-base-100 mb-3">48-Hour Risk Forecast</h3>
          <ForecastChartWidget data={forecast.forecast} />
        </div>
        <WeatherCard weather={weather} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ScenarioSimulator locationId={selectedLocationId} />
        <div className="lg:col-span-2 card p-4 flex items-center">
          <p className="text-xs text-base-400 leading-relaxed">
            <strong className="text-base-200">LANDGUARD-X is a decision-support prototype.</strong>{' '}
            Risk estimates are probabilistic and derived from an interpretable, deterministic scoring
            engine combining rainfall, slope, soil saturation, historical susceptibility, terrain and
            exposure factors. They should be validated against authoritative field observations before
            operational deployment. This system estimates <em>susceptibility</em> and short-term{' '}
            <em>trigger</em> risk — it does not deterministically predict individual landslide events.
          </p>
        </div>
      </div>
    </div>
  )
}
