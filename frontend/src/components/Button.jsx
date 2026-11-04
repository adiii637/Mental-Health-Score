/**
 * Button — primary, secondary, ghost, and danger variants
 * with built-in loading state support.
 * Supports rendering as a router Link when `to` prop is provided.
 */
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: [
    'bg-pine text-white',
    'hover:bg-pine-light active:bg-pine-deep',
    'shadow-sm hover:shadow-md',
    'border border-pine/20',
  ].join(' '),

  secondary: [
    'bg-white text-pine',
    'hover:bg-pine-tint active:bg-pine-tint/80',
    'shadow-sm hover:shadow-md',
    'border border-pine/30',
  ].join(' '),

  ghost: [
    'bg-transparent text-ink-soft',
    'hover:bg-paper-deep/60 active:bg-paper-deep',
    'border border-transparent hover:border-paper-deep',
  ].join(' '),

  danger: [
    'bg-coral text-white',
    'hover:bg-coral-light active:bg-coral-dark',
    'shadow-sm hover:shadow-md',
    'border border-coral/20',
  ].join(' '),

  outline: [
    'bg-transparent text-pine',
    'hover:bg-pine-tint active:bg-pine-tint/80',
    'border-2 border-pine/60 hover:border-pine',
  ].join(' '),
}

const sizes = {
  sm: 'h-8 px-4 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-base rounded-xl gap-2.5',
  xl: 'h-14 px-9 text-base rounded-2xl gap-3',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
  to,
  as: Component,
  onClick,
  ...rest
}) {
  const isDisabled = disabled || loading

  const baseClasses = [
    'inline-flex items-center justify-center font-body font-medium',
    'transition-all duration-200 ease-smooth select-none cursor-pointer text-center',
    'focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2',
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ')

  const content = (
    <>
      {loading && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
      {children}
    </>
  )

  if (to && !isDisabled) {
    return (
      <Link to={to} className={baseClasses} onClick={onClick} {...rest}>
        {content}
      </Link>
    )
  }

  if (to && isDisabled) {
    return (
      <span className={baseClasses} aria-disabled="true" {...rest}>
        {content}
      </span>
    )
  }

  if (Component) {
    return (
      <Component className={baseClasses} onClick={onClick} disabled={isDisabled} {...rest}>
        {content}
      </Component>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={baseClasses}
      {...rest}
    >
      {content}
    </button>
  )
}
