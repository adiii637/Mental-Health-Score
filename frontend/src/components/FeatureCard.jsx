/**
 * FeatureCard — displays an icon, title, and description for feature highlights
 */
export default function FeatureCard({ icon: Icon, title, description, accent = false, className = '' }) {
  return (
    <div
      className={[
        'group relative flex flex-col gap-4 p-6 rounded-2xl',
        'border transition-all duration-300 ease-smooth cursor-default',
        accent
          ? 'bg-pine/5 border-pine/20 hover:bg-pine/8 hover:border-pine/35 hover:shadow-card'
          : 'bg-white/60 border-paper-deep/80 hover:bg-white hover:border-pine/20 hover:shadow-card',
        className,
      ].join(' ')}
    >
      {/* Icon */}
      <div
        className={[
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
          'transition-transform duration-300 group-hover:scale-110',
          accent
            ? 'bg-pine text-white'
            : 'bg-pine-tint text-pine',
        ].join(' ')}
      >
        <Icon size={22} strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display font-medium text-pine-deep text-lg leading-snug">
          {title}
        </h3>
        <p className="text-ink-soft text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {/* Subtle hover accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-pine/0 group-hover:bg-pine/15 transition-all duration-300 rounded-full" />
    </div>
  )
}
