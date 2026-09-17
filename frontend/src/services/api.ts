import {
  RiskPayload, ForecastPayload, WeatherPayload, Incident, AlertItem,
  AnalyticsPayload, ScenarioResult, ImageAssessmentResult, LocationSummary, ModelInfo,
} from '../types'
import { RAW_LOCATIONS, RawLocation } from '../data/locations'
import { computeRisk, forecastCurve, alertLevel } from '../utils/riskEngine'

const BASE = '/api'

let backendReachable = true
export function isBackendReachable() {
  return backendReachable
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = await res.json()
  backendReachable = true
  return data as T
}

function findRaw(id: string): RawLocation {
  return RAW_LOCATIONS.find((l) => l.id === id) ?? RAW_LOCATIONS[0]
}

// ------------------------------------------------------------- LOCATIONS --
export async function getLocations(): Promise<LocationSummary[]> {
  try {
    return await req<LocationSummary[]>('/locations')
  } catch {
    backendReachable = false
    return RAW_LOCATIONS.map((l) => ({ id: l.id, name: l.name, state: l.state, lat: l.lat, lon: l.lon }))
  }
}

// ------------------------------------------------------------------ RISK --
export async function getRisk(locationId: string): Promise<RiskPayload> {
  try {
    return await req<RiskPayload>(`/risk/${locationId}`)
  } catch {
    backendReachable = false
    const loc = findRaw(locationId)
    const risk = computeRisk(loc)
    return {
      location: { id: loc.id, name: loc.name, state: loc.state, lat: loc.lat, lon: loc.lon },
      risk,
      alert: alertLevel(risk.score),
      // Offline fallback cannot reach the trained model.
      ml: null,
    }
  }
}

export async function calculateScenario(locationId: string, rainfall_mm: number, soil_moisture_pct: number): Promise<ScenarioResult> {
  try {
    return await req<ScenarioResult>('/risk/calculate', {
      method: 'POST',
      body: JSON.stringify({ location_id: locationId, rainfall_mm, soil_moisture_pct }),
    })
  } catch {
    backendReachable = false
    const loc = findRaw(locationId)
    const current = computeRisk(loc)
    const scenario = computeRisk({ ...loc, rainfall_mm, soil_moisture_pct })
    return {
      location_id: locationId,
      current,
      scenario,
      change: Math.round((scenario.score - current.score) * 10) / 10,
    }
  }
}

// -------------------------------------------------------------- FORECAST --
export async function getForecast(locationId: string): Promise<ForecastPayload> {
  try {
    return await req<ForecastPayload>(`/forecast/${locationId}`)
  } catch {
    backendReachable = false
    const loc = findRaw(locationId)
    const risk = computeRisk(loc)
    const curve = forecastCurve(risk.score, loc.trend)
    const peak = curve.reduce((a, b) => (b.score > a.score ? b : a))
    const message = loc.trend === 'increasing'
      ? `Risk is expected to increase, peaking around +${peak.hour}h at ${peak.score}/100, driven by forecast rainfall and elevated soil saturation.`
      : loc.trend === 'decreasing'
        ? 'Risk is expected to gradually decline as forecast rainfall eases.'
        : 'Risk is expected to remain broadly stable over the next 48 hours.'
    return {
      location_id: loc.id,
      current_score: risk.score,
      current_level: risk.level,
      trend: loc.trend,
      forecast: curve,
      peak,
      message,
    }
  }
}

// --------------------------------------------------------------- WEATHER --
export async function getWeather(locationId: string): Promise<WeatherPayload> {
  try {
    return await req<WeatherPayload>(`/weather/${locationId}`)
  } catch {
    backendReachable = false
    const loc = findRaw(locationId)
    return {
      location_id: loc.id,
      temperature_c: loc.temperature_c,
      rainfall_mm_24h: loc.rainfall_mm,
      rainfall_forecast_mm: loc.rainfall_forecast_mm,
      humidity_pct: loc.humidity_pct,
      wind_kmh: loc.wind_kmh,
      soil_moisture_pct: loc.soil_moisture_pct,
      forecast_note: loc.rainfall_forecast_mm > loc.rainfall_mm ? 'Heavy rainfall expected' : 'Rainfall expected to ease',
      source: 'Prototype Demonstration Data',
    }
  }
}

// -------------------------------------------------------------- INCIDENTS -
let localIncidents: Incident[] | null = null

export async function getIncidents(): Promise<Incident[]> {
  try {
    return await req<Incident[]>('/incidents')
  } catch {
    backendReachable = false
    if (!localIncidents) {
      localIncidents = [
        { id: 'LGX-1042', location_id: 'dharamshala', location_name: 'NH-503, Dharamshala', type: 'Roadside slope failure', description: 'Debris and loose rock observed encroaching onto carriageway after sustained rainfall.', severity: 'CRITICAL', status: 'RESPONSE PENDING', people_affected: 1240, reported_minutes_ago: 12, source: 'authority' },
        { id: 'LGX-1041', location_id: 'joshimath', location_name: 'Joshimath Town Ward 4', type: 'Ground cracks', description: 'New cracks reported near residential structures, widening over the past week.', severity: 'CRITICAL', status: 'MONITORING', people_affected: 640, reported_minutes_ago: 95, source: 'citizen' },
        { id: 'LGX-1038', location_id: 'mussoorie', location_name: 'Mall Road, Mussoorie', type: 'Slope movement', description: 'Minor slope creep observed behind retaining wall.', severity: 'HIGH', status: 'RESOLVED', people_affected: 180, reported_minutes_ago: 610, source: 'citizen' },
      ]
    }
    return localIncidents
  }
}

export async function dispatchIncident(id: string) {
  try {
    return await req<any>(`/incidents/${id}/dispatch`, { method: 'POST' })
  } catch {
    backendReachable = false
    if (localIncidents) {
      const inc = localIncidents.find((i) => i.id === id)
      if (inc) inc.status = 'RESPONSE DISPATCHED'
    }
    return {
      id, status: 'RESPONSE DISPATCHED', response_team_eta_minutes: 18,
      nearest_hospital_km: 4.7, nearest_shelter_km: 2.1, road_access: 'Partially blocked',
      recommended_actions: ['Inspect slope', 'Restrict traffic', 'Prepare evacuation', 'Notify local authorities'],
    }
  }
}

export async function updateIncidentStatus(id: string, status: string) {
  try {
    return await req<any>(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  } catch {
    backendReachable = false
    if (localIncidents) {
      const inc = localIncidents.find((i) => i.id === id)
      if (inc) inc.status = status
    }
    return { id, status }
  }
}

// ----------------------------------------------------------------- ALERTS -
export async function getAlerts(): Promise<AlertItem[]> {
  try {
    return await req<AlertItem[]>('/alerts')
  } catch {
    backendReachable = false
    return RAW_LOCATIONS.map((loc) => {
      const risk = computeRisk(loc)
      const alert = alertLevel(risk.score)
      return { location_id: loc.id, location_name: loc.name, score: risk.score, level: risk.level, alert_code: alert.code, alert_label: alert.label }
    }).filter((a) => a.alert_code !== 'NORMAL').sort((a, b) => b.score - a.score)
  }
}

// ---------------------------------------------------------------- REPORTS -
export async function submitReport(payload: {
  location_id?: string; location_name: string; hazard_type: string
  description: string; severity: string; contact?: string; photo_provided?: boolean
}) {
  try {
    return await req<{ id: string; status: string; message: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch {
    backendReachable = false
    const id = 'LGX-' + Math.floor(1000 + Math.random() * 9000)
    if (localIncidents) {
      localIncidents.unshift({
        id, location_id: payload.location_id || '', location_name: payload.location_name,
        type: payload.hazard_type, description: payload.description, severity: payload.severity,
        status: 'RECEIVED', people_affected: 0, reported_minutes_ago: 0, source: 'citizen',
      })
    }
    return { id, status: 'RECEIVED', message: 'Your report has been forwarded to the disaster management dashboard.' }
  }
}

// ------------------------------------------------------------- ANALYTICS --
export async function getAnalytics(): Promise<AnalyticsPayload> {
  try {
    return await req<AnalyticsPayload>('/analytics')
  } catch {
    backendReachable = false
    const zone_scores = RAW_LOCATIONS.map((loc) => {
      const r = computeRisk(loc)
      return { name: loc.name, score: r.score, level: r.level }
    }).sort((a, b) => b.score - a.score)
    const critical_zones = zone_scores.filter((z) => z.level === 'CRITICAL').length
    const high_risk_zones = zone_scores.filter((z) => z.level === 'VERY_HIGH').length
    const population_exposed = RAW_LOCATIONS.reduce((s, l) => s + l.population_exposed, 0)
    const incidents = await getIncidents()
    const severity_breakdown: Record<string, number> = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 }
    incidents.forEach((i) => { severity_breakdown[i.severity] = (severity_breakdown[i.severity] ?? 0) + 1 })
    return {
      summary: {
        active_alerts: zone_scores.filter((z) => z.score >= 50).length,
        critical_zones,
        high_risk_zones,
        open_incidents: incidents.filter((i) => i.status !== 'RESOLVED').length,
        population_exposed,
      },
      zone_scores,
      severity_breakdown,
      reports_total: incidents.filter((i) => i.source === 'citizen').length,
    }
  }
}

// --------------------------------------------------------- IMAGE ASSESSMENT
export async function assessImage(file: File | null): Promise<ImageAssessmentResult> {
  try {
    return await req<ImageAssessmentResult>('/image-assessment', {
      method: 'POST',
      body: JSON.stringify({ filename: file?.name ?? 'demo', size: file?.size ?? 0 }),
    })
  } catch {
    backendReachable = false
    const sets = [
      ['exposed soil', 'surface cracking', 'loose debris', 'vegetation disturbance'],
      ['surface cracking', 'water seepage', 'loose debris'],
      ['exposed soil', 'vegetation disturbance'],
    ]
    const seed = (file?.name?.length ?? 3) + (file?.size ?? 0)
    return {
      indicators: sets[seed % sets.length],
      potential_hazard: 'Slope instability indicators',
      confidence: 65 + (seed % 30),
      recommendation: 'Report this location for professional assessment.',
      is_demo: true,
      disclaimer: 'This is a prototype AI-Assisted Visual Hazard Assessment. It does not scientifically confirm an active landslide and should not replace field inspection.',
    }
  }
}

// ----------------------------------------------------------------- MODEL --
export async function getModelInfo(): Promise<ModelInfo | null> {
  try {
    return await req<ModelInfo>('/model/info')
  } catch {
    backendReachable = false
    return null
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    await req('/health')
    return true
  } catch {
    backendReachable = false
    return false
  }
}
