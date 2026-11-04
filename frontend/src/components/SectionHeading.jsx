/**
 * SectionHeading — consistent section title pattern with eyebrow + title + subtitle
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}) {
  const alignClass = {
    center: 'text-center items-center',
    left: 'text-left items-start',
  }[align]

  return (
    <div className={`flex flex-col ${alignClass} gap-3 ${className}`}>
      {eyebrow && (
        <span className="eyebrow">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display font-medium text-pine-deep text-display-md leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-xl text-ink-soft text-base leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className={`divider mt-1 ${align === 'center' ? 'mx-auto' : ''}`} />
    </div>
  )
}
