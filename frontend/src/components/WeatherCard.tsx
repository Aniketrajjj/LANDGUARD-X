import { CloudRain, Droplets, Thermometer, Wind } from 'lucide-react'
import { WeatherPayload } from '../types'

export default function WeatherCard({ weather }: { weather: WeatherPayload }) {
  const stats = [
    { icon: Thermometer, label: 'Temperature', value: `${weather.temperature_c}°C` },
    { icon: CloudRain, label: 'Rainfall (24h)', value: `${weather.rainfall_mm_24h} mm` },
    { icon: Droplets, label: 'Humidity', value: `${weather.humidity_pct}%` },
    { icon: Wind, label: 'Wind', value: `${weather.wind_kmh} km/h` },
  ]

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-base-100">Weather Intelligence</h3>
        <span className="text-[10px] text-base-400 bg-base-700 px-2 py-0.5 rounded">{weather.source}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-base-700/50 rounded-lg p-3">
            <Icon size={14} className="text-accent mb-1.5" />
            <div className="text-base font-mono font-semibold text-base-100">{value}</div>
            <div className="text-[11px] text-base-400">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-base-700/50 rounded-lg p-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-base-400">Soil Moisture</div>
          <div className="text-base font-mono font-semibold text-base-100">{weather.soil_moisture_pct}%</div>
        </div>
        <div className="text-xs text-risk-high font-medium text-right max-w-[55%]">{weather.forecast_note}</div>
      </div>
    </div>
  )
}
