import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function OverviewCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'sage',
  diff = null,
  loading = false,
  children,
}) {
  const badgeColors = {
    sage: 'bg-sage/12 text-sage-dark border-sage/20',
    amber: 'bg-amber/15 text-amber-dark border-amber/25',
    coral: 'bg-coral/12 text-coral border-coral/20',
    pine: 'bg-pine-tint text-pine border-pine/20',
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-paper-deep/80 rounded-2xl p-6 flex flex-col justify-between shadow-card hover:border-pine/30 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs uppercase tracking-wider text-ink-faint">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-pine-tint flex items-center justify-center text-pine">
            <Icon size={18} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <div className="my-1">
        {loading ? (
          <div className="h-9 w-24 bg-paper-deep/60 rounded animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold text-pine-deep tracking-tight">
              {value}
            </span>
            {badge && (
              <span
                className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                  badgeColors[badgeVariant] || badgeColors.sage
                }`}
              >
                {badge}
              </span>
            )}
          </div>
        )}
      </div>

      {children && <div className="mt-2">{children}</div>}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-paper-deep/50 text-xs text-ink-faint">
        <span>{subtitle}</span>
        {diff !== null && diff !== undefined && (
          <div
            className={`flex items-center gap-1 font-mono text-xs font-medium ${
              diff > 0
                ? 'text-sage'
                : diff < 0
                ? 'text-coral'
                : 'text-ink-faint'
            }`}
          >
            {diff > 0 ? (
              <TrendingUp size={13} />
            ) : diff < 0 ? (
              <TrendingDown size={13} />
            ) : (
              <Minus size={13} />
            )}
            <span>
              {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
