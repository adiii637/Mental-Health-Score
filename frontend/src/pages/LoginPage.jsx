import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Leaf, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button'
import { FormField, Input } from '../components/FormElements'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await login(formData.email, formData.password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.message || 'Sign in failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative panel (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 bg-pine-deep relative overflow-hidden flex-col items-center justify-center p-16"
        aria-hidden="true"
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px)',
          }}
        />

        <div className="relative z-10 flex flex-col gap-8 max-w-xs">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <Leaf size={18} strokeWidth={2} className="text-sage-light" />
            </div>
            <span className="font-display font-medium text-white text-xl tracking-tight">
              MentalWell
            </span>
          </div>

          {/* Quote */}
          <blockquote className="border-l-2 border-amber/50 pl-5">
            <p className="font-display italic text-white/80 text-xl leading-snug">
              "Small consistent habits create the foundation for lasting mental resilience."
            </p>
          </blockquote>

          {/* Decorative score cards */}
          <div className="flex flex-col gap-2 mt-4">
            {[
              { label: 'Wellness Score', val: '7.42', color: 'text-sage-light' },
              { label: 'Sleep Quality', val: '8.1h avg', color: 'text-amber' },
              { label: 'Streak', val: '14 days', color: 'text-white/70' },
            ].map(({ label, val, color }) => (
              <div
                key={label}
                className="flex items-center justify-between bg-white/5 border border-white/8 rounded-xl px-4 py-3"
              >
                <span className="text-white/40 text-xs">{label}</span>
                <span className={`font-mono text-sm font-semibold ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-paper page-enter">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-pine rounded-lg flex items-center justify-center shadow-sm">
              <Leaf size={16} strokeWidth={2} className="text-white" />
            </div>
            <span className="font-display font-medium text-pine-deep text-lg tracking-tight">
              MentalWell
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display font-medium text-pine-deep text-2xl mb-1.5">
              Welcome back
            </h1>
            <p className="text-ink-soft text-sm">
              Sign in to your account to continue your wellness journey.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 mb-5 bg-coral/8 border border-coral/30 rounded-xl px-4 py-3"
            >
              <AlertCircle size={15} className="text-coral flex-shrink-0 mt-0.5" />
              <p className="text-xs text-coral leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={handleSubmit}
            aria-label="Sign in form"
          >
            <FormField label="Email address" htmlFor="login-email" required>
              <Input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" required>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft transition-colors duration-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
            >
              <span className="flex items-center gap-2">
                {loading ? 'Signing in…' : <>Sign In <ArrowRight size={16} /></>}
              </span>
            </Button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-ink-soft mt-6">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-pine font-medium hover:text-pine-light transition-colors duration-200"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
