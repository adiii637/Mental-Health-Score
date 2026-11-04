import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button'
import { FormField, Input, Select } from '../components/FormElements'
import { useAuth } from '../hooks/useAuth'

const benefits = [
  'Personalized ML wellness score',
  'AI-powered wellness chat',
  'Private mood journaling',
  'Progress tracking dashboard',
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    terms: false,
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const { firstName, lastName, email, password, terms } = formData

    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (!terms) {
      setError('Please accept the terms and disclaimer to continue.')
      return
    }

    setLoading(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      await register(fullName, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg =
        err?.message?.includes('already registered') || err?.message?.includes('409')
          ? 'An account with this email already exists. Try signing in.'
          : err?.message || 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-paper page-enter">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-pine rounded-lg flex items-center justify-center shadow-sm">
              <Leaf size={16} strokeWidth={2} className="text-white" />
            </div>
            <span className="font-display font-medium text-pine-deep text-lg tracking-tight">
              MentalWell
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="font-display font-medium text-pine-deep text-2xl mb-1.5">
              Create your account
            </h1>
            <p className="text-ink-soft text-sm">
              Start your personalized wellness journey — free to use, always private.
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
            aria-label="Create account form"
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First name" htmlFor="reg-first-name" required>
                <Input
                  id="reg-first-name"
                  type="text"
                  name="firstName"
                  placeholder="Aryan"
                  autoComplete="given-name"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </FormField>
              <FormField label="Last name" htmlFor="reg-last-name" required>
                <Input
                  id="reg-last-name"
                  type="text"
                  name="lastName"
                  placeholder="Sharma"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </FormField>
            </div>

            <FormField label="Email address" htmlFor="reg-email" required>
              <Input
                id="reg-email"
                type="email"
                name="email"
                placeholder="you@university.edu"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="reg-password"
              hint="Minimum 8 characters"
              required
            >
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                id="reg-terms"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 mt-0.5 rounded border-paper-deep text-pine focus:ring-pine/30 focus:ring-2 accent-pine flex-shrink-0"
              />
              <span className="text-xs text-ink-soft leading-relaxed">
                I understand that MentalWell is{' '}
                <strong className="text-ink">not a clinical tool</strong> and does not replace
                professional mental health care.{' '}
                <Link to="#" className="text-pine hover:underline">
                  Terms &amp; Disclaimer
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
            >
              <span className="flex items-center gap-2">
                {loading ? 'Creating account…' : <>Create Account <ArrowRight size={16} /></>}
              </span>
            </Button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-ink-soft mt-5">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-pine font-medium hover:text-pine-light transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right — benefits panel (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-5/12 bg-pine relative overflow-hidden flex-col items-center justify-center p-16"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px)',
          }}
        />

        <div className="relative z-10 flex flex-col gap-8 max-w-xs">
          <h2 className="font-display font-medium text-white text-2xl leading-snug">
            Everything you need for{' '}
            <em className="italic text-sage-light">student wellness</em>
          </h2>

          <ul className="flex flex-col gap-4">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle2 size={17} className="text-amber flex-shrink-0 mt-0.5" />
                <span className="text-white/75 text-sm">{b}</span>
              </li>
            ))}
          </ul>

          {/* Decorative */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-2">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">
              Sample prediction
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-white text-4xl">7.42</span>
              <span className="font-mono text-white/30 text-lg">/10</span>
            </div>
            <span className="font-mono text-xs text-sage-light uppercase tracking-[0.1em]">
              Signal: Strong
            </span>
            <p className="text-white/35 text-xs mt-2 leading-relaxed">
              Based on sleep patterns, screen time, physical activity, and stress levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
