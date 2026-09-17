export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL'

export interface LocationSummary {
  id: string
  name: string
  state: string
  lat: number
  lon: number
}

export interface RiskDriver {
  factor: string
  icon: string
  title: string
  desc: string
  contribution: number
}

export interface RiskResult {
  score: number
  level: RiskLevel
  sub_scores: Record<string, number>
  contributions: Record<string, number>
  weights: Record<string, number>
  primary_drivers: RiskDriver[]
  /** 'hybrid_ml' when the trained model supplied the susceptibility term. */
  mode?: 'hybrid_ml' | 'heuristic'
  ml_susceptibility?: number | null
}

/** Output of the RandomForest trained on the GSI Bhusanket inventory. */
export interface MlSusceptibility {
  probability: number | null
  score_0_100?: number
  band?: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
  features_used?: Record<string, number>
  model?: string
  kind?: string
  error?: string
}

export interface ModelInfo {
  model_available: boolean
  model_type: string | null
  features: string[]
  locations_with_features: string[]
  model_path: string
  error: string | null
  trained_on: string
  note: string
}

export interface RiskPayload {
  location: LocationSummary
  risk: RiskResult
  alert: { code: string; label: string }
  /** null when the model is unavailable — the UI then shows heuristic mode. */
  ml?: MlSusceptibility | null
}

export interface ForecastPoint {
  hour: number
  score: number
  level: RiskLevel
}

export interface ForecastPayload {
  location_id: string
  current_score: number
  current_level: RiskLevel
  trend: 'increasing' | 'decreasing' | 'stable'
  forecast: ForecastPoint[]
  peak: ForecastPoint
  message: string
}

export interface WeatherPayload {
  location_id: string
  temperature_c: number
  rainfall_mm_24h: number
  rainfall_forecast_mm: number
  humidity_pct: number
  wind_kmh: number
  soil_moisture_pct: number
  forecast_note: string
  source: string
}

export interface Incident {
  id: string
  location_id: string
  location_name: string
  type: string
  description: string
  severity: string
  status: string
  people_affected: number
  reported_minutes_ago: number
  source: string
}

export interface AlertItem {
  location_id: string
  location_name: string
  score: number
  level: RiskLevel
  alert_code: string
  alert_label: string
}

export interface AnalyticsPayload {
  summary: {
    active_alerts: number
    critical_zones: number
    high_risk_zones: number
    open_incidents: number
    population_exposed: number
  }
  zone_scores: { name: string; score: number; level: RiskLevel }[]
  severity_breakdown: Record<string, number>
  reports_total: number
}

export interface ScenarioResult {
  location_id: string
  current: RiskResult
  scenario: RiskResult
  change: number
}

export interface ImageAssessmentResult {
  indicators: string[]
  potential_hazard: string
  confidence: number
  recommendation: string
  is_demo: boolean
  disclaimer: string
}
