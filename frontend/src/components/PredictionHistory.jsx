import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, ChevronRight, Loader2, AlertCircle, RefreshCw, ClipboardList } from 'lucide-react'
import { getUserPredictions } from '../api/prediction'

const PAGE_SIZE = 5

function categoryColor(category) {
  if (category === 'Strong') return 'text-sage bg-sage/10 border-sage/20'
  if (category === 'Balanced') return 'text-amber-dark bg-amber/10 border-amber/20'
  return 'text-coral bg-coral/10 border-coral/20'
}

function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  } catch {
    return isoString
  }
}

/**
 * PredictionHistory — reusable component displaying the current user's
 * assessment history with pagination, loading, empty and error states.
 *
 * Props:
 *   onSelectPrediction(prediction) — called when user clicks "View Details"
 *   maxItems — if set, only shows this many items (no pagination); useful for dashboard preview
 *   compact — reduces spacing for embedded use
 */
export default function PredictionHistory({ onSelectPrediction, maxItems, compact = false }) {
  const [predictions, setPredictions] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const effectiveLimit = maxItems ?? PAGE_SIZE

  const fetchPredictions = useCallback(async (newOffset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUserPredictions({ limit: effectiveLimit, offset: newOffset })
      setPredictions(data.predictions)
      setTotal(data.total)
      setOffset(newOffset)
    } catch (err) {
      setError(err?.message || 'Could not load prediction history.')
    } finally {
      setLoading(false)
    }
  }, [effectiveLimit])

  useEffect(() => {
    fetchPredictions(0)
  }, [fetchPredictions])

  const handlePrev = () => fetchPredictions(Math.max(0, offset - effectiveLimit))
  const handleNext = () => fetchPredictions(offset + effectiveLimit)
  const hasMore = offset + effectiveLimit < total
  const hasPrev = offset > 0

  if (loading) {
    return (
      <div className={`flex items-center justify-center gap-3 text-ink-soft ${compact ? 'py-6' : 'py-12'}`}>
        <Loader2 size={18} className="animate-spin text-pine" />
        <span className="text-sm">Loading history…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center gap-3 ${compact ? 'py-6' : 'py-10'}`}>
        <div className="flex items-center gap-2 text-coral text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
        <button
          onClick={() => fetchPredictions(0)}
          className="flex items-center gap-1.5 text-xs text-pine hover:text-pine-deep transition-colors duration-200"
        >
          <RefreshCw size={13} /> Retry
        </button>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-3 text-center ${compact ? 'py-6' : 'py-12'}`}>
        <div className="w-12 h-12 rounded-2xl bg-pine-tint flex items-center justify-center">
          <ClipboardList size={22} className="text-pine" strokeWidth={1.5} />
        </div>
        <p className="text-ink-soft text-sm">No assessments yet</p>
        <p className="text-ink-faint text-xs">Complete your first assessment to start tracking your wellness.</p>
        <button
          onClick={() => navigate('/assessment')}
          className="mt-1 text-xs text-pine font-medium hover:text-pine-deep transition-colors duration-200"
        >
          Take an Assessment →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* History list */}
      {predictions.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between bg-white/60 border border-paper-deep/70 rounded-xl px-4 py-3 hover:border-pine/30 hover:bg-white/80 transition-all duration-200 group"
        >
          <div className="flex items-center gap-4 min-w-0">
            {/* Score bubble */}
            <div className="w-11 h-11 rounded-xl bg-pine-tint flex flex-col items-center justify-center flex-shrink-0">
              <span className="font-mono text-sm font-semibold text-pine-deep leading-none">
                {p.predicted_mental_health_score.toFixed(1)}
              </span>
              <span className="font-mono text-[9px] text-ink-faint leading-none">/10</span>
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full border ${categoryColor(p.score_category)}`}
                >
                  {p.score_category}
                </span>
              </div>
              <p className="text-xs text-ink-faint mt-1 truncate">{formatDate(p.created_at)}</p>
            </div>
          </div>

          {/* View details */}
          <button
            onClick={() => onSelectPrediction ? onSelectPrediction(p) : navigate(`/assessment?id=${p.id}`)}
            className="flex items-center gap-1 text-xs text-ink-faint group-hover:text-pine transition-colors duration-200 flex-shrink-0 ml-2"
            aria-label={`View details for assessment on ${formatDate(p.created_at)}`}
          >
            Details
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      ))}

      {/* Pagination — only shown when not in maxItems/compact mode */}
      {!maxItems && (hasPrev || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-ink-faint">
            Showing {offset + 1}–{Math.min(offset + effectiveLimit, total)} of {total}
          </p>
          <div className="flex gap-2">
            {hasPrev && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-paper-deep hover:border-pine/30 hover:text-pine text-ink-soft transition-all duration-200"
              >
                ← Prev
              </button>
            )}
            {hasMore && (
              <button
                onClick={handleNext}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-paper-deep hover:border-pine/30 hover:text-pine text-ink-soft transition-all duration-200"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}

      {/* "Show all" link in compact mode */}
      {maxItems && total > maxItems && (
        <button
          onClick={() => navigate('/assessment')}
          className="text-xs text-pine font-medium hover:text-pine-deep transition-colors duration-200 text-left"
        >
          View all {total} assessments →
        </button>
      )}
    </div>
  )
}
