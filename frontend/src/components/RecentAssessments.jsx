import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, Clock, Moon, BookOpen, Smartphone, Activity } from 'lucide-react'
import Button from './Button'

function categoryBadge(category) {
  if (category === 'Strong') {
    return 'bg-sage/12 text-sage-dark border-sage/20'
  }
  if (category === 'Balanced') {
    return 'bg-amber/15 text-amber-dark border-amber/25'
  }
  return 'bg-coral/12 text-coral border-coral/20'
}

export default function RecentAssessments({ assessments = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card">
        <div className="h-6 w-44 bg-paper-deep/60 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-paper-deep/40 rounded-xl animate-pulse" />
          <div className="h-16 bg-paper-deep/40 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!assessments || assessments.length === 0) {
    return (
      <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card text-center flex flex-col items-center justify-center py-10">
        <Calendar size={28} className="text-pine/40 mb-3" strokeWidth={1.5} />
        <h4 className="font-display font-medium text-pine-deep text-base mb-1">
          No Recent Assessments
        </h4>
        <p className="text-xs text-ink-soft max-w-sm mb-4">
          Your completed assessments and calculated wellness metrics will appear here.
        </p>
        <Button variant="primary" size="sm" to="/assessment">
          Begin Assessment
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-medium text-pine-deep text-lg">
            Recent Assessment History
          </h3>
          <p className="text-ink-faint text-xs mt-0.5">
            Review your past scores and recorded wellness habits
          </p>
        </div>
        <Link
          to="/assessment"
          className="text-xs font-medium text-pine hover:underline flex items-center gap-1 group"
        >
          New Assessment
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="divide-y divide-paper-deep/60">
        {assessments.map((item) => {
          const dateStr = item.created_at
            ? new Date(item.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recent'

          const feats = item.input_features || {}

          return (
            <div
              key={item.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper/30 -mx-3 px-3 rounded-xl transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <div className="text-center sm:text-left min-w-[70px]">
                  <span className="font-mono text-2xl font-bold text-pine-deep">
                    {Number(item.predicted_mental_health_score).toFixed(2)}
                  </span>
                  <span className="block text-[10px] font-mono text-ink-faint">
                    / 10
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${categoryBadge(
                        item.score_category
                      )}`}
                    >
                      {item.score_category}
                    </span>
                    <span className="text-xs text-ink-faint flex items-center gap-1">
                      <Clock size={11} /> {dateStr}
                    </span>
                  </div>

                  {/* Feature snapshot pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-ink-soft">
                    {feats.sleep_hours_per_night !== undefined && (
                      <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded border border-paper-deep/60">
                        <Moon size={11} className="text-pine" /> {feats.sleep_hours_per_night}h sleep
                      </span>
                    )}
                    {feats.study_hours !== undefined && (
                      <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded border border-paper-deep/60">
                        <BookOpen size={11} className="text-pine" /> {feats.study_hours}h study
                      </span>
                    )}
                    {feats.avg_daily_usage_hours !== undefined && (
                      <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded border border-paper-deep/60">
                        <Smartphone size={11} className="text-amber-dark" /> {feats.avg_daily_usage_hours}h {feats.most_used_platform || 'social'}
                      </span>
                    )}
                    {feats.stress_level && (
                      <span className="inline-flex items-center gap-1 bg-paper px-2 py-0.5 rounded border border-paper-deep/60">
                        <Activity size={11} className="text-coral" /> {feats.stress_level} stress
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
