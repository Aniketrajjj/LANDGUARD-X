// Mirrors backend/app/risk_engine/engine.py. Only used when the FastAPI
// backend cannot be reached, so the demo never fully breaks (offline-first).
import { RawLocation } from '../data/locations'
import { RiskDriver, RiskLevel, RiskResult, ForecastPoint } from '../types'

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

const LAND_COVER_RISK: Record<string, number> = {
  barren: 95,
  sparse_vegetation: 75,
  urban_mixed: 45,
  forest: 25,
}

const WEIGHTS = {
  rainfall: 0.30,
  slope: 0.25,
  soil: 0.15,
  historical: 0.10,
  elevation: 0.10,
  land_cover: 0.05,
  infrastructure: 0.05,
}

const DRIVER_LABELS: Record<string, { icon: string; title: string; desc: string }> = {
  rainfall: { icon: '🌧', title: 'Heavy rainfall', desc: 'Rainfall is significantly above the local trigger threshold.' },
  slope: { icon: '⛰', title: 'Steep terrain', desc: 'Slope angle increases susceptibility to slope failure.' },
  soil: { icon: '💧', title: 'High soil moisture', desc: 'Increased saturation reduces slope stability.' },
  historical: { icon: '📚', title: 'Historical susceptibility', desc: 'The region has previously experienced landslide events.' },
  elevation: { icon: '🗻', title: 'Terrain elevation band', desc: 'Elevation and overburden characteristics elevate susceptibility.' },
  land_cover: { icon: '🌱', title: 'Land cover', desc: 'Sparse vegetation/exposed soil reduces slope-holding root structure.' },
  infrastructure: { icon: '🏘', title: 'Infrastructure exposure', desc: 'A large exposed population/infrastructure footprint raises overall risk.' },
}

export function classify(score: number): RiskLevel {
  if (score <= 30) return 'LOW'
  if (score <= 50) return 'MODERATE'
  if (score <= 70) return 'HIGH'
  if (score <= 85) return 'VERY_HIGH'
  return 'CRITICAL'
}

export function computeRisk(loc: RawLocation): RiskResult {
  const sub = {
    rainfall: clamp((loc.rainfall_mm / 150) * 100),
    slope: clamp((loc.slope_deg / 45) * 100),
    soil: clamp(loc.soil_moisture_pct),
    historical: clamp(loc.historical_susceptibility),
    elevation: (loc.elevation_m >= 800 && loc.elevation_m <= 2200) ? 85
      : ((loc.elevation_m > 2200 && loc.elevation_m <= 3000) || (loc.elevation_m >= 400 && loc.elevation_m < 800)) ? 55 : 30,
    land_cover: clamp(LAND_COVER_RISK[loc.land_cover] ?? 50),
    infrastructure: clamp((loc.population_exposed / 15000) * 100),
  }

  const contributions: Record<string, number> = {}
  let total = 0
  for (const k of Object.keys(sub) as (keyof typeof sub)[]) {
    const c = Math.round(sub[k] * WEIGHTS[k] * 10) / 10
    contributions[k] = c
    total += c
  }
  total = Math.round(clamp(total) * 10) / 10
  const level = classify(total)

  const ranked = Object.entries(contributions).sort((a, b) => b[1] - a[1])
  const primary_drivers: RiskDriver[] = ranked
    .filter(([, v]) => v >= 5)
    .slice(0, 4)
    .map(([k, v]) => ({ factor: k, contribution: v, ...DRIVER_LABELS[k] }))

  return {
    score: total,
    level,
    sub_scores: Object.fromEntries(Object.entries(sub).map(([k, v]) => [k, Math.round(v * 10) / 10])),
    contributions,
    weights: WEIGHTS,
    primary_drivers,
    // The browser fallback has no access to the trained model.
    mode: 'heuristic' as const,
    ml_susceptibility: null,
  }
}

export function forecastCurve(baseScore: number, trend: string): ForecastPoint[] {
  const hours = [0, 3, 6, 12, 24, 48]
  let deltas: number[]
  if (trend === 'increasing') deltas = [0, 4, 9, 14, 12, -5]
  else if (trend === 'decreasing') deltas = [0, -3, -6, -10, -14, -18]
  else deltas = [0, 1, -1, 2, -2, 1]

  return hours.map((h, i) => {
    const score = Math.round(clamp(baseScore + deltas[i]) * 10) / 10
    return { hour: h, score, level: classify(score) }
  })
}

export function alertLevel(score: number) {
  if (score >= 85) return { code: 'CRITICAL_WARNING', label: '🚨 CRITICAL LANDSLIDE WARNING' }
  if (score >= 70) return { code: 'HIGH_ALERT', label: '⚠️ HIGH LANDSLIDE ALERT' }
  if (score >= 50) return { code: 'WATCH', label: '🟡 LANDSLIDE WATCH' }
  return { code: 'NORMAL', label: '🟢 NORMAL' }
}
