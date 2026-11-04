import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { TrendingUp, Sparkles } from 'lucide-react'
import Button from './Button'

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const categoryColors = {
      Strong: 'text-sage',
      Balanced: 'text-amber-dark',
      Strained: 'text-coral',
    }

    return (
      <div className="bg-pine-deep text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs">
        <p className="font-mono text-white/50 text-[11px] mb-1">{data.full_date || data.date}</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-semibold text-white">
            {Number(data.score).toFixed(2)}
          </span>
          <span className="text-white/40 text-xs">/ 10</span>
          <span
            className={`font-mono text-[11px] font-medium ml-1 ${
              categoryColors[data.category] || 'text-white'
            }`}
          >
            {data.category}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function ScoreTrendChart({ trend = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card h-80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-pine/30 border-t-pine animate-spin" />
          <p className="text-xs text-ink-faint">Loading score history…</p>
        </div>
      </div>
    )
  }

  // Empty state: no data points
  if (!trend || trend.length === 0) {
    return (
      <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-8 shadow-card flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-2xl bg-pine-tint flex items-center justify-center text-pine mb-3">
          <Sparkles size={22} strokeWidth={1.75} />
        </div>
        <h3 className="font-display font-medium text-pine-deep text-lg mb-1">
          No Trend Data Yet
        </h3>
        <p className="text-ink-soft text-xs max-w-sm mb-4 leading-relaxed">
          Complete your first mental health assessment to start tracking your score progression over time.
        </p>
        <Button variant="primary" size="sm" to="/assessment">
          Take Assessment
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-medium text-pine-deep text-lg">
              Historical Score Trend
            </h3>
            <span className="text-[11px] font-mono text-ink-faint bg-paper-deep/50 px-2 py-0.5 rounded-md">
              {trend.length} assessment{trend.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-ink-faint text-xs mt-0.5">
            Chronological progression of predicted mental health scores (0–10 scale)
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 text-sage">
            <span className="w-2 h-2 rounded-full bg-sage" /> Strong (≥ 7.0)
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-dark">
            <span className="w-2 h-2 rounded-full bg-amber" /> Balanced (4.0–6.9)
          </span>
          <span className="inline-flex items-center gap-1.5 text-coral">
            <span className="w-2 h-2 rounded-full bg-coral" /> Strained (&lt; 4.0)
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trend}
            margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2EE" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#8C9A94"
              fontSize={11}
              fontFamily="var(--font-mono, monospace)"
              tickLine={false}
              axisLine={{ stroke: '#DFE5DF' }}
              dy={6}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              stroke="#8C9A94"
              fontSize={11}
              fontFamily="var(--font-mono, monospace)"
              tickLine={false}
              axisLine={{ stroke: '#DFE5DF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Wellness baseline lines */}
            <ReferenceLine y={7.0} stroke="#4C9A78" strokeDasharray="2 2" strokeOpacity={0.4} />
            <ReferenceLine y={4.0} stroke="#D9534F" strokeDasharray="2 2" strokeOpacity={0.4} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#21594A"
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: '#21594A',
                strokeWidth: 2,
                stroke: '#FFFFFF',
              }}
              activeDot={{
                r: 6,
                fill: '#163D33',
                stroke: '#EEF2EE',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-paper-deep/60 flex items-center justify-between text-xs text-ink-faint">
        <span className="flex items-center gap-1">
          <TrendingUp size={13} className="text-pine" /> Model-generated wellness trajectory
        </span>
        <span className="text-[11px] font-mono">Scores updated after each submission</span>
      </div>
    </div>
  )
}
