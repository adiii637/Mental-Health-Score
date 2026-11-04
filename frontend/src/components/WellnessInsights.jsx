import {
  Moon,
  Smartphone,
  Activity,
  BookOpen,
  HeartPulse,
  Info,
  Sparkles,
} from 'lucide-react'

const iconMap = {
  sleep: { icon: Moon, color: 'text-pine', bg: 'bg-pine-tint' },
  screen_time: { icon: Smartphone, color: 'text-amber-dark', bg: 'bg-amber/12' },
  physical_activity: { icon: Activity, color: 'text-sage', bg: 'bg-sage/12' },
  study: { icon: BookOpen, color: 'text-pine', bg: 'bg-pine/10' },
  stress: { icon: HeartPulse, color: 'text-coral', bg: 'bg-coral/12' },
}

export default function WellnessInsights({ insights = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card">
        <div className="h-6 w-48 bg-paper-deep/60 rounded animate-pulse mb-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="h-28 bg-paper-deep/40 rounded-xl animate-pulse" />
          <div className="h-28 bg-paper-deep/40 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-medium text-pine-deep text-lg">
            Personalized Wellness Insights
          </h3>
          <p className="text-ink-faint text-xs mt-0.5">
            Lifestyle observations based on your latest recorded assessment features
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper border border-paper-deep text-[11px] font-mono text-ink-faint">
          <Info size={12} className="text-pine" />
          <span>Non-diagnostic</span>
        </div>
      </div>

      {!insights || insights.length === 0 ? (
        <div className="p-6 bg-paper/50 border border-dashed border-paper-deep rounded-xl text-center flex flex-col items-center">
          <Sparkles size={20} className="text-pine/40 mb-2" />
          <p className="text-xs text-ink-soft font-medium">No insights available yet</p>
          <p className="text-[11px] text-ink-faint mt-1 max-w-xs">
            Complete an assessment to generate personalized lifestyle observations based on your routine.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item, idx) => {
            const meta = iconMap[item.category] || iconMap.sleep
            const Icon = meta.icon

            return (
              <div
                key={idx}
                className="bg-paper/40 border border-paper-deep/70 rounded-xl p-4 flex gap-3 hover:bg-paper/70 transition-colors duration-150"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 ${meta.color}`}
                >
                  <Icon size={17} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-display font-medium text-pine-deep text-sm truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono text-ink-faint bg-white/70 px-1.5 py-0.5 rounded border border-paper-deep/50 flex-shrink-0">
                      {item.tag || 'Observation'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mandatory ethical disclaimer */}
      <div className="mt-4 pt-3 border-t border-paper-deep/60 flex items-start gap-2 text-[11px] text-ink-faint">
        <Info size={13} className="text-ink-faint flex-shrink-0 mt-0.5" />
        <p>
          Observations are intended for general lifestyle awareness and self-reflection. They do not constitute medical, psychological, or clinical diagnosis.
        </p>
      </div>
    </div>
  )
}
