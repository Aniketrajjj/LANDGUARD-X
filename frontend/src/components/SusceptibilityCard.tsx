import { Brain, AlertTriangle } from 'lucide-react'
import { MlSusceptibility } from '../types'

const BAND_COLORS: Record<string, string> = {
  VERY_HIGH: 'text-red-400 border-red-500/40 bg-red-500/10',
  HIGH: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  MODERATE: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  LOW: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
}

const FEATURE_LABELS: Record<string, string> = {
  Elevation_m: 'Elevation',
  Slope_deg: 'Slope',
  Soil_Clay_pct: 'Clay',
  Soil_Sand_pct: 'Sand',
  Soil_Silt_pct: 'Silt',
  Soil_pH: 'pH',
  Soil_SOC: 'Organic carbon',
  Soil_BulkDensity: 'Bulk density',
}

const FEATURE_UNITS: Record<string, string> = {
  Elevation_m: ' m',
  Slope_deg: '°',
  Soil_Clay_pct: '%',
  Soil_Sand_pct: '%',
  Soil_Silt_pct: '%',
  Soil_pH: '',
  Soil_SOC: ' g/kg',
  Soil_BulkDensity: ' kg/dm³',
}

export default function SusceptibilityCard({ ml }: { ml?: MlSusceptibility | null }) {
  if (!ml || ml.probability === null) {
    return (
      <div className="bg-base-700/50 border border-base-600/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-base-100">Terrain susceptibility model</h3>
        </div>
        <p className="text-xs text-base-400 leading-relaxed">
          The trained model is not loaded, so risk scores are coming from the deterministic
          rule-based engine only. Run{' '}
          <code className="text-base-300">scripts/precompute_location_features.py</code> and place{' '}
          <code className="text-base-300">landslide_model.joblib</code> in{' '}
          <code className="text-base-300">backend/models/</code> to enable it.
        </p>
      </div>
    )
  }

  const band = ml.band ?? 'MODERATE'
  const pct = ml.score_0_100 ?? Math.round((ml.probability ?? 0) * 100)

  return (
    <div className="bg-base-700/50 border border-base-600/60 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-base-100">Terrain susceptibility model</h3>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${BAND_COLORS[band]}`}>
          {band.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-base-50">{pct}</span>
        <span className="text-xs text-base-400">/ 100 static susceptibility</span>
      </div>

      <div className="w-full h-1.5 bg-base-600/60 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-indigo-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {ml.features_used && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
          {Object.entries(ml.features_used).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-base-400">{FEATURE_LABELS[k] ?? k}</span>
              <span className="text-base-200 font-medium">
                {typeof v === 'number' ? v.toFixed(1) : v}
                {FEATURE_UNITS[k] ?? ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-base-400 leading-relaxed border-t border-base-600/60 pt-2">
        Random Forest trained on 36,071 GSI Bhusanket records using terrain and soil only. This rates
        how landslide-prone the ground <em>is</em>, not whether one is likely today — rainfall and
        soil moisture are handled separately by the risk engine.
      </p>
    </div>
  )
}
