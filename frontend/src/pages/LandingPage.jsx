import { Link } from 'react-router-dom'
import {
  BrainCircuit,
  MessageCircleHeart,
  BookOpen,
  Music2,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  BarChart3,
  Shield,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import Container from '../components/Container'
import FeatureCard from '../components/FeatureCard'
import SectionHeading from '../components/SectionHeading'
import ScoreGauge from '../components/ScoreGauge'

/* ── Feature data ─────────────────────────────────────────── */
const features = [
  {
    icon: BrainCircuit,
    title: 'ML Score Prediction',
    description:
      'A trained Random Forest model analyzes your daily habits — sleep, screen time, study hours, stress levels — and returns a personalized wellness signal on a 0–10 scale.',
    accent: false,
  },
  {
    icon: MessageCircleHeart,
    title: 'AI Wellness Assistant',
    description:
      'A Gemini-powered conversational companion offering evidence-based coping strategies, habit suggestions, and a non-judgmental space to reflect.',
    accent: false,
  },
  {
    icon: BookOpen,
    title: 'Daily Journaling',
    description:
      'Structured mood check-ins and free-form journaling to track emotional patterns over time. Your entries are private and securely stored.',
    accent: false,
  },
  {
    icon: Music2,
    title: 'Wellness Resources',
    description:
      'Curated calming music, breathing exercises, daily mindfulness quotes, and evidence-backed self-care recommendations tailored to your score.',
    accent: false,
  },
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    description:
      'Visualize your score trends, habit correlations, and wellbeing journey over time with clear, insightful charts.',
    accent: false,
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description:
      'Your data belongs to you. All assessments and journal entries are protected with authenticated accounts and secure storage.',
    accent: false,
  },
]

/* ── How It Works steps ───────────────────────────────────── */
const steps = [
  {
    number: '01',
    title: 'Tell us about your habits',
    description:
      'Fill in a short, structured assessment covering your sleep patterns, screen time, study hours, physical activity, and perceived stress.',
  },
  {
    number: '02',
    title: 'Get your wellness signal',
    description:
      'Our ML model — trained on real student data — processes your inputs and returns a mental health score from 0 to 10 with contextual interpretation.',
  },
  {
    number: '03',
    title: 'Take guided action',
    description:
      'Receive personalized recommendations, chat with the AI wellness assistant, and track your progress through journaling and your personal dashboard.',
  },
]

/* ── Stat pills ───────────────────────────────────────────── */
const stats = [
  { value: '5,000+', label: 'Student records trained on' },
  { value: '87.8%', label: 'Model accuracy (R²)' },
  { value: '12', label: 'Lifestyle factors analyzed' },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen page-enter">
      <Navbar />

      <main className="flex-1">
        {/* ══ HERO SECTION ════════════════════════════════════ */}
        <section
          className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
          aria-labelledby="hero-heading"
        >
          {/* Background radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(33,89,74,0.09) 0%, transparent 65%)',
            }}
          />

          {/* Decorative floating orbs */}
          <div
            className="absolute top-20 right-[10%] w-64 h-64 rounded-full opacity-[0.04] bg-pine animate-float"
            style={{ animationDelay: '0s' }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-16 left-[8%] w-40 h-40 rounded-full opacity-[0.05] bg-sage animate-float"
            style={{ animationDelay: '2s' }}
            aria-hidden="true"
          />

          <Container>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — copy */}
              <div className="flex flex-col gap-6">
                <span className="eyebrow w-fit">
                  <Sparkles size={12} aria-hidden="true" />
                  Student Wellness Analytics
                </span>

                <h1
                  id="hero-heading"
                  className="font-display font-medium text-pine-deep leading-[1.02] tracking-[-0.02em]"
                  style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.6rem)' }}
                >
                  Understand how your{' '}
                  <em className="italic text-pine not-italic" style={{ fontStyle: 'italic' }}>
                    habits
                  </em>{' '}
                  shape your mind.
                </h1>

                <p className="text-ink-soft text-lg leading-relaxed max-w-lg">
                  MentalWell is an evidence-informed wellness tool that predicts your mental health
                  signal from daily lifestyle patterns — then guides you toward lasting improvement.
                </p>

                {/* Stat pills */}
                <div className="flex flex-wrap gap-3">
                  {stats.map(({ value, label }) => (
                    <div
                      key={label}
                      className="flex items-baseline gap-2 bg-white/70 border border-paper-deep/80 rounded-full px-4 py-2"
                    >
                      <span className="font-mono font-semibold text-pine text-sm">{value}</span>
                      <span className="text-ink-faint text-xs">{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button variant="primary" size="lg" to="/register" className="gap-2">
                    Get Started
                    <ArrowRight size={16} />
                  </Button>
                  <Button variant="secondary" size="lg" to="/assessment" className="gap-2">
                    Try Assessment
                  </Button>
                </div>

                {/* Trust signal */}
                <p className="flex items-center gap-2 text-ink-faint text-xs">
                  <CheckCircle2 size={13} className="text-sage flex-shrink-0" aria-hidden="true" />
                  Not a clinical tool. For educational and self-awareness purposes only.
                </p>
              </div>

              {/* Right — gauge showcase */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-sm">
                  {/* Card behind gauge */}
                  <div className="bg-white/80 backdrop-blur-sm border border-paper-deep/60 rounded-3xl p-8 shadow-card">
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <span className="eyebrow text-[10px]">Live wellness signal</span>
                    </div>

                    <ScoreGauge score={7.42} size="md" animated />

                    {/* Habit summary pills */}
                    <div className="mt-6 flex flex-col gap-2">
                      {[
                        { label: 'Sleep', value: '7.5h', good: true },
                        { label: 'Screen time', value: '3.2h', good: true },
                        { label: 'Stress level', value: 'Medium', good: false },
                      ].map(({ label, value, good }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-paper/60 border border-paper-deep/40"
                        >
                          <span className="text-ink-soft text-xs">{label}</span>
                          <span
                            className={`font-mono text-xs font-medium ${
                              good ? 'text-sage-dark' : 'text-amber-dark'
                            }`}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating badge */}
                  <div
                    className="absolute -top-4 -right-4 bg-amber text-white text-xs font-mono font-semibold px-3 py-1.5 rounded-full shadow-sm animate-pulse-soft"
                    aria-hidden="true"
                  >
                    ML Powered
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll cue */}
            <div className="flex justify-center mt-16">
              <ChevronDown
                size={20}
                className="text-ink-faint animate-bounce"
                aria-hidden="true"
              />
            </div>
          </Container>
        </section>

        {/* ══ FEATURES SECTION ════════════════════════════════ */}
        <section
          className="py-20 md:py-28"
          aria-labelledby="features-heading"
          id="features"
        >
          <Container>
            <SectionHeading
              eyebrow="What MentalWell Offers"
              title="Everything you need for student wellness"
              subtitle="A holistic toolkit — predictive, conversational, and reflective — designed around the real challenges students face."
            />

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
              {features.map((feat) => (
                <FeatureCard key={feat.title} {...feat} />
              ))}
            </div>
          </Container>
        </section>

        {/* ══ HOW IT WORKS SECTION ════════════════════════════ */}
        <section
          className="py-20 md:py-28 bg-pine-deep relative overflow-hidden"
          aria-labelledby="how-it-works-heading"
          id="how-it-works"
        >
          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px)',
            }}
            aria-hidden="true"
          />

          <Container>
            <SectionHeading
              eyebrow="Simple by Design"
              title={<span className="text-white">Three steps to clarity</span>}
              subtitle={
                <span className="text-white/55">
                  No lengthy questionnaires. No complex onboarding. Just honest inputs and
                  actionable insights.
                </span>
              }
            />

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 stagger">
              {steps.map((step, idx) => (
                <div key={step.number} className="relative flex flex-col gap-4">
                  {/* Connector line */}
                  {idx < steps.length - 1 && (
                    <div
                      className="hidden md:block absolute top-6 left-[calc(100%+8px)] w-[calc(100%-16px)] h-px bg-white/10"
                      aria-hidden="true"
                    />
                  )}

                  {/* Step number */}
                  <span className="font-mono text-[3rem] font-semibold text-white/10 leading-none">
                    {step.number}
                  </span>

                  {/* Step divider */}
                  <div className="w-8 h-0.5 bg-amber/60 rounded-full" />

                  {/* Step content */}
                  <h3 className="font-display font-medium text-white text-xl leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            {/* CTA inside dark section */}
            <div className="flex justify-center mt-14">
              <Button variant="secondary" size="lg" to="/register" className="gap-2">
                Start your assessment
                <ArrowRight size={16} />
              </Button>
            </div>
          </Container>
        </section>

        {/* ══ RESPONSIBLE USE SECTION ═════════════════════════ */}
        <section className="py-16 md:py-20" aria-labelledby="disclaimer-heading">
          <Container size="narrow">
            <div className="bg-amber/8 border border-amber/25 rounded-2xl px-8 py-8 text-center flex flex-col items-center gap-4">
              <span className="eyebrow">Important Notice</span>
              <h2
                id="disclaimer-heading"
                className="font-display font-medium text-pine-deep text-xl"
              >
                MentalWell is not a clinical tool
              </h2>
              <p className="text-ink-soft text-sm leading-relaxed max-w-2xl">
                This platform is designed for{' '}
                <strong className="text-ink">educational self-awareness and habit tracking</strong>.
                It does not provide medical diagnoses, psychiatric evaluations, or clinical mental
                health treatment. The predictions are based on lifestyle data patterns from a
                student dataset and should not be interpreted as medical advice.
              </p>
              <p className="text-ink-soft text-sm">
                If you are experiencing a mental health crisis, please contact a qualified
                professional or reach out to a crisis helpline:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: 'iCall India', value: '9152987821' },
                  { label: 'Vandrevala Foundation', value: '1860-2662-345' },
                  { label: 'Tele-MANAS', value: '14416' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-0.5 bg-white/70 border border-paper-deep rounded-xl px-4 py-3"
                  >
                    <span className="text-ink-faint text-xs">{label}</span>
                    <span className="font-mono text-sm font-semibold text-pine">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  )
}
