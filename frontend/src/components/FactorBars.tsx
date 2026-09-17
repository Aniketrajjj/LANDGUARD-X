import { RiskResult } from '../types'

const FACTOR_LABELS: Record<string, string> = {
  rainfall: 'Rainfall',
  slope: 'Slope',
  soil: 'Soil Saturation',
  historical: 'Historical Risk',
  elevation: 'Elevation',
  land_cover: 'Land Cover',
  infrastructure: 'Infrastructure Exposure',
}

export default function FactorBars({ risk }: { risk: RiskResult }) {
  const entries = Object.entries(risk.contributions).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-base-300">{FACTOR_LABELS[key] ?? key}</span>
            <span className="font-mono text-base-100">+{value}</span>
          </div>
          <div className="h-1.5 bg-base-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between text-sm pt-2 mt-1 border-t border-base-600/60">
        <span className="font-semibold text-base-100">TOTAL</span>
        <span className="font-mono font-bold text-base-100">{risk.score}/100</span>
      </div>
    </div>
  )
}
