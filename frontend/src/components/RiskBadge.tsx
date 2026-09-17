import { RiskLevel } from '../types'

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  VERY_HIGH: '#ef4444',
  CRITICAL: '#dc2626',
}

export const RISK_ICON: Record<RiskLevel, string> = {
  LOW: '🟢',
  MODERATE: '🟡',
  HIGH: '🟠',
  VERY_HIGH: '🔴',
  CRITICAL: '🔴',
}

export function riskLabel(level: RiskLevel) {
  return level.replace('_', ' ')
}

export default function RiskBadge({ level, size = 'md' }: { level: RiskLevel; size?: 'sm' | 'md' | 'lg' }) {
  const color = RISK_COLORS[level]
  const sizeClasses = size === 'lg' ? 'text-base px-4 py-1.5' : size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-3 py-1'
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizeClasses}`}
      style={{ color, borderColor: `${color}55`, background: `${color}1a` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {riskLabel(level)}
    </span>
  )
}
