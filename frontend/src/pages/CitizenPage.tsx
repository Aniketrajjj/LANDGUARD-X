import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../hooks/useAppState'
import { getRisk, getForecast, assessImage, submitReport } from '../services/api'
import { RiskPayload, ForecastPayload, ImageAssessmentResult } from '../types'
import RiskBadge from '../components/RiskBadge'
import { TrendingUp, TrendingDown, Minus, Upload, ImageIcon, CheckCircle2, Loader2 } from 'lucide-react'

const TrendIcon = { increasing: TrendingUp, decreasing: TrendingDown, stable: Minus } as const

const HAZARD_TYPES = [
  'Ground cracks', 'Rockfall', 'Mud/debris flow', 'Road damage',
  'Water seepage', 'Slope movement', 'Other',
]

export default function CitizenPage() {
  const { selectedLocationId, locations } = useAppState()
  const [risk, setRisk] = useState<RiskPayload | null>(null)
  const [forecast, setForecast] = useState<ForecastPayload | null>(null)

  useEffect(() => {
    getRisk(selectedLocationId).then(setRisk)
    getForecast(selectedLocationId).then(setForecast)
  }, [selectedLocationId])

  const loc = locations.find((l) => l.id === selectedLocationId)
  const Trend = forecast ? TrendIcon[forecast.trend] : Minus

  // Image assessment state
  const fileRef = useRef<HTMLInputElement>(null)
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [assessing, setAssessing] = useState(false)
  const [assessment, setAssessment] = useState<ImageAssessmentResult | null>(null)

  function onFileChange(f: File | null) {
    setImgFile(f)
    setAssessment(null)
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setImgPreview(reader.result as string)
      reader.readAsDataURL(f)
    } else {
      setImgPreview(null)
    }
  }

  async function runAssessment() {
    setAssessing(true)
    const result = await assessImage(imgFile)
    setAssessment(result)
    setAssessing(false)
  }

  // Report form state
  const [hazardType, setHazardType] = useState(HAZARD_TYPES[0])
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('MODERATE')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ id: string; message: string } | null>(null)

  async function onSubmitReport(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await submitReport({
      location_id: selectedLocationId,
      location_name: loc?.name ?? 'Unknown',
      hazard_type: hazardType,
      description: description || `${hazardType} reported by citizen`,
      severity,
      contact,
      photo_provided: !!imgFile,
    })
    setSubmitted(res)
    setSubmitting(false)
    setDescription('')
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-base-100">Check Your Landslide Risk</h2>
        <p className="text-sm text-base-400">Search a location above, or use your current location.</p>
      </div>

      {risk && forecast && (
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-base-400 mb-1">YOUR LOCATION</div>
              <div className="text-lg font-bold text-base-100">{risk.location.name}</div>
              <div className="text-xs text-base-400">{risk.location.state}</div>
            </div>
            <div>
              <div className="text-xs text-base-400 mb-1">CURRENT RISK</div>
              <div className="text-lg font-mono font-bold text-base-100 mb-1">{risk.risk.score}/100</div>
              <RiskBadge level={risk.risk.level} />
            </div>
            <div>
              <div className="text-xs text-base-400 mb-1">NEXT 6 HOURS</div>
              <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: forecast.trend === 'increasing' ? '#f97316' : '#8896a5' }}>
                <Trend size={15} />
                {forecast.trend === 'increasing' ? 'Risk Increasing' : forecast.trend === 'decreasing' ? 'Risk Decreasing' : 'Stable'}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-base-600/60 space-y-2">
            {risk.risk.primary_drivers.slice(0, 2).map((d) => (
              <div key={d.factor} className="text-xs text-base-300 flex items-center gap-2">
                <span>{d.icon}</span> {d.title} — {d.desc}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image assessment */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-base-100 mb-1">AI-Assisted Visual Hazard Assessment</h3>
        <p className="text-xs text-base-400 mb-4">Upload a photo of a suspected hazard (slope cracks, debris, seepage).</p>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-base-600 rounded-xl p-6 text-center cursor-pointer hover:border-accent transition-colors"
        >
          {imgPreview ? (
            <img src={imgPreview} alt="preview" className="max-h-48 mx-auto rounded-lg object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-base-400">
              <Upload size={22} />
              <span className="text-sm">Click to upload a slope image</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />

        {imgFile && !assessment && (
          <button
            onClick={runAssessment}
            disabled={assessing}
            className="mt-3 w-full bg-accent hover:bg-accent-dim text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {assessing ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
            {assessing ? 'Analyzing image...' : 'Run Visual Hazard Assessment'}
          </button>
        )}

        {assessment && (
          <div className="mt-4 bg-base-700/50 rounded-lg p-4 fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-base-200">Potential Indicators Detected</span>
              <span className="text-xs font-mono text-accent">{assessment.confidence}% confidence</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {assessment.indicators.map((ind) => (
                <span key={ind} className="text-xs bg-base-800 border border-base-600 rounded-full px-2.5 py-1 text-base-200">
                  ✓ {ind}
                </span>
              ))}
            </div>
            <div className="text-sm text-base-100 font-medium mb-1">{assessment.potential_hazard}</div>
            <div className="text-xs text-accent mb-3">{assessment.recommendation}</div>
            <p className="text-[11px] text-base-400 leading-relaxed border-t border-base-600/60 pt-3">{assessment.disclaimer}</p>
          </div>
        )}
      </div>

      {/* Hazard report form */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-base-100 mb-1">Report a Hazard</h3>
        <p className="text-xs text-base-400 mb-4">Your report is forwarded directly to the disaster management dashboard.</p>

        {submitted ? (
          <div className="bg-risk-low/10 border border-risk-low/30 rounded-lg p-4 flex items-start gap-3 fade-in">
            <CheckCircle2 size={20} className="text-risk-low shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-base-100">Report submitted — {submitted.id}</div>
              <div className="text-xs text-base-300 mt-1">Status: RECEIVED</div>
              <div className="text-xs text-base-400 mt-1">{submitted.message}</div>
              <button onClick={() => setSubmitted(null)} className="text-xs text-accent mt-2 underline">
                Submit another report
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmitReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-base-300 block mb-1.5">Location</label>
                <input readOnly value={loc?.name ?? ''} className="w-full bg-base-700 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-300" />
              </div>
              <div>
                <label className="text-xs text-base-300 block mb-1.5">Hazard Type</label>
                <select value={hazardType} onChange={(e) => setHazardType(e.target.value)} className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-100 focus:outline-none focus:ring-1 focus:ring-accent">
                  {HAZARD_TYPES.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-base-300 block mb-1.5">Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Describe what you observed..."
                className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-100 placeholder:text-base-400 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-base-300 block mb-1.5">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-100 focus:outline-none focus:ring-1 focus:ring-accent">
                  <option>LOW</option><option>MODERATE</option><option>HIGH</option><option>CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-base-300 block mb-1.5">Contact (optional)</label>
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or email" className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-base-100 placeholder:text-base-400 focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
            </div>
            <button
              type="submit" disabled={submitting}
              className="w-full bg-accent hover:bg-accent-dim text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Hazard Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
