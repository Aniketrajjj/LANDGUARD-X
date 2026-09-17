import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { ForecastPoint } from '../types'

export default function ForecastChartWidget({ data }: { data: ForecastPoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.hour === 0 ? 'NOW' : `+${d.hour}H` }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b9eff" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b9eff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#28323f" vertical={false} />
        <XAxis dataKey="label" stroke="#5c6b7c" fontSize={11} tickLine={false} axisLine={{ stroke: '#28323f' }} />
        <YAxis domain={[0, 100]} stroke="#5c6b7c" fontSize={11} tickLine={false} axisLine={false} />
        <ReferenceLine y={70} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={85} stroke="#dc2626" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Tooltip
          contentStyle={{ background: '#151c27', border: '1px solid #28323f', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#e4e9ed' }}
          formatter={(value: any) => [`${value}/100`, 'Risk Score']}
        />
        <Area type="monotone" dataKey="score" stroke="#3b9eff" strokeWidth={2.5} fill="url(#riskGradient)" dot={{ r: 3, fill: '#3b9eff' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
