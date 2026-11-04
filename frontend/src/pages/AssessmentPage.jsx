import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BrainCircuit, AlertCircle, Loader2,
  CheckCircle2, LayoutDashboard, RotateCcw, History,
  ChevronDown,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import Button from '../components/Button'
import ScoreGauge from '../components/ScoreGauge'
import PredictionHistory from '../components/PredictionHistory'
import { submitAuthenticatedAssessment } from '../api/prediction'
import { useAuth } from '../hooks/useAuth'

// ── Constants matching trained ML model's expected categories ──────────────

const PLATFORMS = [
  'Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
  'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat',
]
const TOP_COUNTRIES = [
  'India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France',
]
const STRESS_LEVELS = ['Low', 'Medium', 'High', 'Very High']

const INITIAL_FORM = {
  age: '',
  gender: '',
  country: '',
  academic_level: '',
  most_used_platform: '',
  purpose_of_use: '',
  avg_daily_usage_hours: '',
  daily_unlocks: '',
  study_hours: '',
  physical_activity_hours: '',
  sleep_hours_per_night: '',
  stress_level: '',
}

// ── Score explanations ─────────────────────────────────────────────────────

function getScoreExplanation(score, category) {
  if (category === 'Strong') {
    return {
      headline: 'Strong wellness signal',
      body: 'Your lifestyle factors show a positive balance. Regular sleep, moderate screen time, and physical activity are contributing to a healthy baseline.',
      suggestions: [
        'Keep maintaining your current sleep schedule',
        'Continue balancing study with regular breaks',
        'Stay connected with close friends and support networks',
      ],
    }
  }
  if (category === 'Balanced') {
    return {
      headline: 'Balanced — room to grow',
      body: 'Your habits show a reasonable balance, but some factors may be creating friction. Small adjustments in sleep or screen habits can make a meaningful difference.',
      suggestions: [
        'Aim for 7–8 hours of consistent sleep each night',
        'Try reducing screen time by 30–60 minutes per day',
        'Add a short daily walk or light physical activity',
      ],
    }
  }
  return {
    headline: 'Strained — worth paying attention',
    body: 'Some lifestyle factors appear to be placing additional pressure on your wellbeing. These patterns are common during high-stress academic periods.',
    suggestions: [
      'Prioritise sleep — even a 30-minute improvement matters',
      'Consider digital detox periods, especially before bed',
      'Speak with a campus counsellor or trusted person if needed',
    ],
  }
}

// ── Validation ─────────────────────────────────────────────────────────────

function validateForm(form) {
  const errors = {}
  if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 10 || Number(form.age) > 100)
    errors.age = 'Age must be between 10 and 100'
  if (!form.gender) errors.gender = 'Required'
  if (!form.country.trim()) errors.country = 'Required'
  if (!form.academic_level) errors.academic_level = 'Required'
  if (!form.most_used_platform) errors.most_used_platform = 'Required'
  if (!form.purpose_of_use) errors.purpose_of_use = 'Required'
  const h = (v) => v === '' || isNaN(Number(v)) || Number(v) < 0 || Number(v) > 24
  if (h(form.avg_daily_usage_hours)) errors.avg_daily_usage_hours = 'Enter hours (0–24)'
  if (!form.daily_unlocks || isNaN(Number(form.daily_unlocks)) || Number(form.daily_unlocks) < 0)
    errors.daily_unlocks = 'Enter a number ≥ 0'
  if (h(form.study_hours)) errors.study_hours = 'Enter hours (0–24)'
  if (h(form.physical_activity_hours)) errors.physical_activity_hours = 'Enter hours (0–24)'
  if (h(form.sleep_hours_per_night)) errors.sleep_hours_per_night = 'Enter hours (0–24)'
  if (!form.stress_level) errors.stress_level = 'Required'
  return errors
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldError({ message }) {
  if (!message) return null
  return <span className="text-xs text-coral mt-0.5">{message}</span>
}

function inputClass(hasError) {
  return [
    'h-10 px-3.5 rounded-xl text-sm text-ink bg-white border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine/50',
    hasError
      ? 'border-coral/60 hover:border-coral/80'
      : 'border-paper-deep/80 hover:border-pine/30',
  ].join(' ')
}

function selectClass(hasError) {
  return inputClass(hasError) + ' appearance-none cursor-pointer'
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [result, setResult] = useState(null) // { id, predicted_mental_health_score, score_category, created_at }
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null)

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setApiError(null)
  }, [])

  const setStress = useCallback((level) => {
    setForm((prev) => ({ ...prev, stress_level: level }))
    setErrors((prev) => ({ ...prev, stress_level: undefined }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    setSelectedHistoryItem(null)

    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      // Scroll to first error
      const firstErrorId = Object.keys(validationErrors)[0]
      document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        age: parseInt(form.age, 10),
        gender: form.gender,
        country: form.country.trim(),
        academic_level: form.academic_level,
        most_used_platform: form.most_used_platform,
        purpose_of_use: form.purpose_of_use,
        avg_daily_usage_hours: parseFloat(form.avg_daily_usage_hours),
        daily_unlocks: parseInt(form.daily_unlocks, 10),
        study_hours: parseFloat(form.study_hours),
        physical_activity_hours: parseFloat(form.physical_activity_hours),
        sleep_hours_per_night: parseFloat(form.sleep_hours_per_night),
        stress_level: form.stress_level,
      }

      const data = await submitAuthenticatedAssessment(payload)
      setResult(data)

      // Scroll result panel into view on mobile
      setTimeout(() => {
        document.getElementById('result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setApiError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setResult(null)
    setApiError(null)
    setSelectedHistoryItem(null)
  }

  const displayResult = selectedHistoryItem || result
  const explanation = displayResult
    ? getScoreExplanation(displayResult.predicted_mental_health_score, displayResult.score_category)
    : null

  return (
    <div className="flex flex-col min-h-screen page-enter">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <Container>
          {/* Back link */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-pine transition-colors duration-200 mb-8 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Dashboard
          </Link>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* ── Left: Form Panel ───────────────────────────────────────── */}
            <div className="bg-white/70 border border-paper-deep/70 rounded-2xl p-8">
              <div className="mb-8">
                <span className="eyebrow mb-3">ML Assessment</span>
                <h1 className="font-display font-medium text-pine-deep text-2xl mt-2">
                  Your wellness snapshot
                </h1>
                <p className="text-ink-soft text-sm mt-2">
                  Answer honestly for the most accurate signal.
                  {user?.name && (
                    <span className="text-pine font-medium"> Hi, {user.name.split(' ')[0]}.</span>
                  )}
                </p>
              </div>

              {/* API error */}
              {apiError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 mb-6 bg-coral/8 border border-coral/30 rounded-xl px-4 py-3"
                >
                  <AlertCircle size={15} className="text-coral flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-coral">{apiError}</p>
                </div>
              )}

              <form
                noValidate
                onSubmit={handleSubmit}
                aria-label="Mental health assessment form"
                className="space-y-7"
              >
                {/* ── Section 01: Profile ── */}
                <fieldset>
                  <legend className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-xs text-amber font-semibold">01</span>
                    <span className="font-display font-medium text-pine-deep text-base">Profile</span>
                    <div className="flex-1 h-px bg-paper-deep/70" />
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Age */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="age" className="text-sm font-medium text-ink/90">
                        Age <span className="text-coral text-xs">*</span>
                      </label>
                      <input
                        id="age" name="age" type="number" min="10" max="100" placeholder="e.g. 21"
                        value={form.age} onChange={handleChange} disabled={submitting}
                        className={inputClass(!!errors.age)}
                        aria-invalid={!!errors.age}
                      />
                      <FieldError message={errors.age} />
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="gender" className="text-sm font-medium text-ink/90">
                        Gender <span className="text-coral text-xs">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="gender" name="gender"
                          value={form.gender} onChange={handleChange} disabled={submitting}
                          className={selectClass(!!errors.gender) + ' w-full pr-8'}
                          aria-invalid={!!errors.gender}
                        >
                          <option value="" disabled>Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                      </div>
                      <FieldError message={errors.gender} />
                    </div>

                    {/* Country */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="country" className="text-sm font-medium text-ink/90">
                        Country <span className="text-coral text-xs">*</span>
                      </label>
                      <input
                        id="country" name="country" type="text" list="country-list" placeholder="e.g. India"
                        value={form.country} onChange={handleChange} disabled={submitting}
                        className={inputClass(!!errors.country)}
                        aria-invalid={!!errors.country}
                      />
                      <datalist id="country-list">
                        {TOP_COUNTRIES.map((c) => <option key={c} value={c} />)}
                      </datalist>
                      <FieldError message={errors.country} />
                    </div>
                  </div>
                </fieldset>

                {/* ── Section 02: Academic & Digital Habits ── */}
                <fieldset>
                  <legend className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-xs text-amber font-semibold">02</span>
                    <span className="font-display font-medium text-pine-deep text-base">Academic &amp; Digital Habits</span>
                    <div className="flex-1 h-px bg-paper-deep/70" />
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Academic Level */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="academic_level" className="text-sm font-medium text-ink/90">
                        Academic level <span className="text-coral text-xs">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="academic_level" name="academic_level"
                          value={form.academic_level} onChange={handleChange} disabled={submitting}
                          className={selectClass(!!errors.academic_level) + ' w-full pr-8'}
                        >
                          <option value="" disabled>Select</option>
                          <option value="High School">High School</option>
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Graduate">Graduate</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                      </div>
                      <FieldError message={errors.academic_level} />
                    </div>

                    {/* Most Used Platform */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="most_used_platform" className="text-sm font-medium text-ink/90">
                        Most-used platform <span className="text-coral text-xs">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="most_used_platform" name="most_used_platform"
                          value={form.most_used_platform} onChange={handleChange} disabled={submitting}
                          className={selectClass(!!errors.most_used_platform) + ' w-full pr-8'}
                        >
                          <option value="" disabled>Select</option>
                          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                      </div>
                      <FieldError message={errors.most_used_platform} />
                    </div>

                    {/* Purpose of Use */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="purpose_of_use" className="text-sm font-medium text-ink/90">
                        Primary purpose <span className="text-coral text-xs">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="purpose_of_use" name="purpose_of_use"
                          value={form.purpose_of_use} onChange={handleChange} disabled={submitting}
                          className={selectClass(!!errors.purpose_of_use) + ' w-full pr-8'}
                        >
                          <option value="" disabled>Select</option>
                          <option value="Networking">Networking</option>
                          <option value="Education">Education</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="News">News</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                      </div>
                      <FieldError message={errors.purpose_of_use} />
                    </div>

                    {/* Avg Daily Usage */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="avg_daily_usage_hours" className="text-sm font-medium text-ink/90">
                        Avg. daily usage <span className="text-coral text-xs">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="avg_daily_usage_hours" name="avg_daily_usage_hours"
                          type="number" min="0" max="24" step="0.1" placeholder="0.0"
                          value={form.avg_daily_usage_hours} onChange={handleChange} disabled={submitting}
                          className={inputClass(!!errors.avg_daily_usage_hours) + ' w-full pr-12'}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-xs font-mono">hrs</span>
                      </div>
                      <FieldError message={errors.avg_daily_usage_hours} />
                    </div>

                    {/* Daily Unlocks */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label htmlFor="daily_unlocks" className="text-sm font-medium text-ink/90">
                        Daily phone unlocks <span className="text-coral text-xs">*</span>
                      </label>
                      <input
                        id="daily_unlocks" name="daily_unlocks"
                        type="number" min="0" step="1" placeholder="e.g. 60"
                        value={form.daily_unlocks} onChange={handleChange} disabled={submitting}
                        className={inputClass(!!errors.daily_unlocks)}
                      />
                      <FieldError message={errors.daily_unlocks} />
                    </div>
                  </div>
                </fieldset>

                {/* ── Section 03: Lifestyle & Stress ── */}
                <fieldset>
                  <legend className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-xs text-amber font-semibold">03</span>
                    <span className="font-display font-medium text-pine-deep text-base">Lifestyle &amp; Stress</span>
                    <div className="flex-1 h-px bg-paper-deep/70" />
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    {[
                      { id: 'study_hours', label: 'Study hours / day' },
                      { id: 'physical_activity_hours', label: 'Physical activity / day' },
                      { id: 'sleep_hours_per_night', label: 'Sleep / night' },
                    ].map(({ id, label }) => (
                      <div key={id} className="flex flex-col gap-1.5">
                        <label htmlFor={id} className="text-sm font-medium text-ink/90">
                          {label} <span className="text-coral text-xs">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id={id} name={id}
                            type="number" min="0" max="24" step="0.1" placeholder="0.0"
                            value={form[id]} onChange={handleChange} disabled={submitting}
                            className={inputClass(!!errors[id]) + ' w-full pr-12'}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-xs font-mono">hrs</span>
                        </div>
                        <FieldError message={errors[id]} />
                      </div>
                    ))}
                  </div>

                  {/* Stress Level — segmented control */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-sm font-medium text-ink/90">
                      Perceived stress level <span className="text-coral text-xs">*</span>
                    </span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Stress level">
                      {STRESS_LEVELS.map((level) => (
                        <button
                          key={level} type="button"
                          onClick={() => setStress(level)}
                          disabled={submitting}
                          className={[
                            'px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-pine/30',
                            form.stress_level === level
                              ? 'bg-pine text-white border-pine shadow-sm'
                              : 'bg-white text-ink-soft border-paper-deep hover:border-pine/30 hover:bg-pine-tint/50',
                          ].join(' ')}
                          aria-pressed={form.stress_level === level}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <FieldError message={errors.stress_level} />
                  </div>
                </fieldset>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={submitting}
                  >
                    <span className="flex items-center gap-2">
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Analysing…</>
                      ) : (
                        <><BrainCircuit size={17} /> Read My Signal</>
                      )}
                    </span>
                  </Button>
                  <p className="text-center text-xs text-ink-faint mt-3">
                    This is a wellness estimation tool, not a clinical diagnosis.
                  </p>
                </div>
              </form>

              {/* History toggle */}
              <div className="mt-8 pt-6 border-t border-paper-deep/60">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-pine transition-colors duration-200"
                >
                  <History size={15} />
                  {showHistory ? 'Hide' : 'Show'} previous assessments
                </button>
                {showHistory && (
                  <div className="mt-4">
                    <PredictionHistory
                      onSelectPrediction={(p) => {
                        setSelectedHistoryItem(p)
                        setTimeout(() => {
                          document.getElementById('result-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 100)
                      }}
                      maxItems={5}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Result Panel ─────────────────────────────────────── */}
            <div id="result-panel" className="flex flex-col gap-4 sticky top-24">
              <div className="bg-white/70 border border-paper-deep/70 rounded-2xl p-6 flex flex-col items-center gap-4">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                  Your signal
                </span>

                {displayResult ? (
                  <>
                    <ScoreGauge
                      score={displayResult.predicted_mental_health_score}
                      size="md"
                      animated
                    />

                    {/* Score explanation */}
                    {explanation && (
                      <div className="w-full mt-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-pine flex-shrink-0" />
                          <p className="text-sm font-medium text-pine-deep">{explanation.headline}</p>
                        </div>
                        <p className="text-xs text-ink-soft leading-relaxed">{explanation.body}</p>

                        {/* Suggestions */}
                        <div className="bg-pine-tint/60 rounded-xl p-3 space-y-1.5">
                          <p className="text-xs font-semibold text-pine-deep mb-2">Wellness suggestions</p>
                          {explanation.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-pine flex-shrink-0 mt-1.5" />
                              <p className="text-xs text-ink-soft">{s}</p>
                            </div>
                          ))}
                        </div>

                        {/* Timestamp */}
                        {displayResult.created_at && (
                          <p className="text-xs text-ink-faint text-center">
                            Assessed{' '}
                            {new Date(displayResult.created_at).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: true,
                            })}
                          </p>
                        )}

                        {/* Disclaimer */}
                        <div className="bg-amber/8 border border-amber/20 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-ink-soft leading-relaxed">
                            <strong className="text-amber-dark">Educational estimate only.</strong>{' '}
                            This score is based on lifestyle patterns in the dataset. It is not a medical
                            diagnosis, clinical assessment, or substitute for professional mental health support.
                            If you are in distress, please reach out to a counsellor or helpline.
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-2">
                          <Button variant="primary" size="sm" fullWidth to="/dashboard">
                            <LayoutDashboard size={14} className="mr-1.5" /> View Dashboard
                          </Button>
                          <button
                            onClick={handleReset}
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium text-ink-soft border border-paper-deep hover:border-pine/30 hover:text-pine transition-all duration-200"
                          >
                            <RotateCcw size={13} /> Take another assessment
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <ScoreGauge idle size="md" />
                    <p className="text-ink-faint text-xs text-center leading-relaxed">
                      Fill in the form and submit to generate a predicted mental health score from 0–10.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
