/**
 * FormField — label + input wrapper with error state
 */
export function FormField({ label, htmlFor, error, hint, required = false, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-ink/90 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-coral text-xs" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-ink-faint">{hint}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-coral flex items-center gap-1">
          <span aria-hidden="true">↑</span> {error}
        </p>
      )}
    </div>
  )
}

/* Base input classes */
const inputBase = [
  'w-full h-10 px-3.5 rounded-xl text-sm text-ink',
  'bg-white border border-paper-deep/80',
  'placeholder:text-ink-faint/70',
  'transition-all duration-200',
  'hover:border-pine/30',
  'focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine/50',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-paper',
].join(' ')

const inputError = 'border-coral/60 focus:ring-coral/30 focus:border-coral/60'

/**
 * Input — text, number, email, password
 */
export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={[inputBase, error ? inputError : '', className].join(' ')}
      {...props}
    />
  )
}

/**
 * Select — dropdown
 */
export function Select({ error, children, className = '', ...props }) {
  return (
    <select
      className={[
        inputBase,
        'appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%234A5850\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_10px_center] pr-9',
        error ? inputError : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </select>
  )
}

/**
 * SegmentedControl — pill-style option selector (for stress level)
 */
export function SegmentedControl({ options, value, onChange, name, error }) {
  return (
    <div
      role="group"
      aria-label={name}
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40',
              isActive
                ? 'bg-pine text-white border-pine shadow-sm'
                : error
                ? 'bg-white text-ink-soft border-coral/40 hover:border-coral/70 hover:bg-coral/5'
                : 'bg-white text-ink-soft border-paper-deep hover:border-pine/30 hover:bg-pine-tint/50',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Textarea — multi-line input
 */
export function Textarea({ error, className = '', rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={[
        'w-full px-3.5 py-2.5 rounded-xl text-sm text-ink resize-none',
        'bg-white border border-paper-deep/80',
        'placeholder:text-ink-faint/70',
        'transition-all duration-200',
        'hover:border-pine/30',
        'focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-paper',
        error ? inputError : '',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
