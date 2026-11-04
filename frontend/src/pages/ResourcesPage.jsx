import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Quote,
  Moon,
  Activity,
  Smartphone,
  BookOpen,
  Headphones,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  HeartHandshake,
  Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import BreathingExercise from '../components/BreathingExercise'
import Button from '../components/Button'

const quotes = [
  {
    text: "You don't have to control your thoughts. You just have to stop letting them control you.",
    author: "Dan Millman",
    theme: "Mental Clarity",
  },
  {
    text: "Almost everything will work again if you unplug it for a few minutes, including you.",
    author: "Anne Lamott",
    theme: "Rest & Recovery",
  },
  {
    text: "You don't have to be positive all the time. It is perfectly okay to feel frustrated, exhausted, or anxious. Acknowledging your emotions makes you human.",
    author: "Lori Deschene",
    theme: "Self-Compassion",
  },
  {
    text: "Self-care is not selfish. You cannot serve from an empty vessel.",
    author: "Eleanor Brown",
    theme: "Pacing",
  },
]

const guidanceSections = [
  {
    id: 'sleep',
    icon: Moon,
    title: 'Sleep Hygiene Recommendations',
    tagline: 'Foundations for memory consolidation and emotional regulation',
    color: 'text-pine',
    bg: 'bg-pine-tint',
    tips: [
      {
        head: 'Consistent Sleep Window',
        desc: 'Aim to wake up and go to sleep within a 30-minute window daily. Regular sleep architecture stabilizes circadian rhythm.',
      },
      {
        head: '60-Minute Digital Sunset',
        desc: 'Switch off smartphones and laptops 1 hour prior to bed, or enable warm night shift filtering to prevent melatonin suppression.',
      },
      {
        head: 'Optimal Sleep Environment',
        desc: 'Maintain a dark, quiet room with a cool ambient temperature (18–20°C / 65–68°F) to assist body temperature drops necessary for deep sleep.',
      },
      {
        head: 'Caffeine Cutoff Timing',
        desc: 'Avoid high-caffeine beverages (coffee, energy drinks) at least 6–8 hours prior to sleeping, as caffeine has an average half-life of 5 hours.',
      },
    ],
  },
  {
    id: 'physical',
    icon: Activity,
    title: 'Physical Activity & Movement',
    tagline: 'Simple physical habits to release tension and clear mental fog',
    color: 'text-sage',
    bg: 'bg-sage/12',
    tips: [
      {
        head: 'Daily 20-Minute Brisk Walk',
        desc: 'A 20-minute outdoor walk combines light aerobic movement with ambient natural lighting, reducing cortisol and lifting afternoon fatigue.',
      },
      {
        head: 'Movement Snacks between Lectures',
        desc: 'Take 2-minute movement breaks (stretching, calf raises, shoulder rolls) every 50 minutes of seated coursework to promote circulation.',
      },
      {
        head: 'Desk Posture & Eye Rest',
        desc: 'Follow the 20-20-20 rule: Every 20 minutes, look at an object 20 feet away for at least 20 seconds to prevent ocular strain.',
      },
      {
        head: 'Progressive Muscle Relaxation',
        desc: 'Systematically tense and release muscle groups from your toes to your forehead before bed to induce physical calm.',
      },
    ],
  },
  {
    id: 'digital',
    icon: Smartphone,
    title: 'Digital Wellbeing & Social Media',
    tagline: 'Practical boundaries to protect focus against algorithm fatigue',
    color: 'text-amber-dark',
    bg: 'bg-amber/12',
    tips: [
      {
        head: 'Notification Auditing',
        desc: 'Mute non-essential social notifications and group chats. Reserve immediate push alerts only for urgent personal messages.',
      },
      {
        head: 'Grayscale Mode during Study',
        desc: 'Turn on black-and-white display settings in your phone accessibility options to reduce the dopamine pull of vibrant app feeds.',
      },
      {
        head: 'Designated No-Phone Zones',
        desc: 'Keep mobile devices out of immediate arms reach while reading or preparing for exams; out-of-sight reduces passive subconscious checks.',
      },
      {
        head: 'Replace Scrolling with Micro-Actions',
        desc: 'When feeling the reflex to unlock your phone, substitute it with drinking a glass of water, taking three deep breaths, or jotting down a journal note.',
      },
    ],
  },
  {
    id: 'study',
    icon: BookOpen,
    title: 'Study-Life Balance & Academic Pacing',
    tagline: 'Sustainable productivity without cognitive depletion',
    color: 'text-pine',
    bg: 'bg-pine/10',
    tips: [
      {
        head: 'The Pomodoro Technique (25 / 5)',
        desc: 'Work in focused 25-minute intervals followed by 5-minute restorative breaks. After 4 cycles, reward yourself with an extended 25-minute rest.',
      },
      {
        head: 'Establish a Hard-Stop Study Boundary',
        desc: 'Set a firm end time for academic tasks each evening (e.g. 9:00 PM). Unbounded study schedules increase dread and diminish productivity.',
      },
      {
        head: 'Daily Top 3 Priorities',
        desc: 'Identify no more than three core academic goals each morning. Completing high-priority tasks lowers background anxiety and decision fatigue.',
      },
      {
        head: 'Campus Social Connection',
        desc: 'Schedule brief lunches or tea walks with peers. Academic loneliness significantly elevates self-reported stress scores.',
      },
    ],
  },
]

const audioResources = [
  {
    title: 'Lofi Girl — Beats to Relax / Study to',
    platform: 'YouTube Live',
    description: 'Continuous non-intrusive instrumental lo-fi beats designed for uninterrupted study focus and calming anxiety.',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    badge: 'Study Focus',
  },
  {
    title: 'SomaFM: Drone Zone',
    platform: 'SomaFM Stream',
    description: 'Atmospheric ambient and drone music curated for deep contemplation, stress relief, and restorative background listening.',
    url: 'https://somafm.com/dronezone/',
    badge: 'Ambient Calm',
  },
  {
    title: 'Calm — 10-Minute Mindfulness & Soundscapes',
    platform: 'Calm Official',
    description: 'Guided short meditations, nature rain soundscapes, and body scans created by mindfulness practitioners.',
    url: 'https://www.youtube.com/@calm',
    badge: 'Guided Meditation',
  },
  {
    title: 'myNoise — Custom Sound Machines & Nature',
    platform: 'myNoise Web',
    description: 'Interactive audio generator with rain, binaural waves, and white noise calibrated for concentration and masking noise.',
    url: 'https://mynoise.net/',
    badge: 'Sound Generator',
  },
]

export default function ResourcesPage() {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const currentQuote = quotes[quoteIndex]

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % quotes.length)
  }

  return (
    <div className="flex flex-col min-h-screen page-enter">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <Container>
          {/* Header */}
          <div className="mb-8">
            <span className="eyebrow mb-1.5">Evidence-Informed Wellbeing</span>
            <h1 className="font-display font-medium text-pine-deep text-3xl sm:text-4xl">
              Wellness Resources & Tools
            </h1>
            <p className="text-ink-soft text-xs sm:text-sm mt-1 max-w-2xl">
              Practical lifestyle habits, interactive breathing guides, and curated calming tools designed to support student health and academic resilience.
            </p>
          </div>

          {/* Daily Reflection Quote Banner */}
          <div className="mb-12 bg-pine-deep rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-card">
            <div className="absolute top-4 right-6 opacity-10 pointer-events-none">
              <Quote size={100} className="text-white" />
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full">
                Daily Reflection • {currentQuote.theme}
              </span>
              <button
                type="button"
                onClick={handleNextQuote}
                className="text-xs font-mono text-white/80 hover:text-white flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition-all"
                title="View another quote"
              >
                <Sparkles size={13} />
                <span>Next Reflection</span>
              </button>
            </div>

            <blockquote className="relative z-10 max-w-2xl">
              <p className="font-display italic text-white/95 text-lg sm:text-xl leading-relaxed">
                "{currentQuote.text}"
              </p>
              <footer className="mt-3 font-mono text-white/50 text-xs">
                — {currentQuote.author}
              </footer>
            </blockquote>
          </div>

          {/* Interactive Guided Breathing Section */}
          <div className="mb-14">
            <BreathingExercise />
          </div>

          {/* Curated Recommendations Grid */}
          <div className="mb-14">
            <div className="mb-6">
              <span className="eyebrow mb-1">Practical Frameworks</span>
              <h2 className="font-display font-medium text-pine-deep text-2xl">
                Student Lifestyle Recommendations
              </h2>
              <p className="text-ink-soft text-xs mt-0.5">
                Evidence-informed daily practices to balance study pressure and mental health
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guidanceSections.map((sec) => {
                const Icon = sec.icon

                return (
                  <div
                    key={sec.id}
                    className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card hover:border-pine/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-xl ${sec.bg} flex items-center justify-center ${sec.color}`}
                      >
                        <Icon size={20} strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="font-display font-medium text-pine-deep text-lg">
                          {sec.title}
                        </h3>
                        <p className="text-[11px] text-ink-faint">{sec.tagline}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {sec.tips.map((tip, idx) => (
                        <div key={idx} className="border-t border-paper-deep/50 pt-2.5">
                          <p className="text-xs font-semibold text-pine-deep font-display mb-0.5">
                            {tip.head}
                          </p>
                          <p className="text-xs text-ink-soft leading-relaxed">
                            {tip.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Calming Audio & Music Resources */}
          <div className="mb-14">
            <div className="mb-6">
              <span className="eyebrow mb-1">Curated External Audio</span>
              <h2 className="font-display font-medium text-pine-deep text-2xl">
                Calming Soundscapes & Focus Audio
              </h2>
              <p className="text-ink-soft text-xs mt-0.5">
                Legitimate, verified external audio resources for deep study focus and stress reduction
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {audioResources.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/80 border border-paper-deep/80 rounded-2xl p-5 shadow-card hover:border-pine/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono text-pine bg-pine-tint px-2 py-0.5 rounded-full border border-pine/20">
                        {item.badge}
                      </span>
                      <span className="text-[11px] font-mono text-ink-faint">
                        {item.platform}
                      </span>
                    </div>

                    <h4 className="font-display font-medium text-pine-deep text-base mb-1.5 group-hover:text-pine transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-paper-deep/60 flex items-center justify-between text-xs text-pine font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Headphones size={13} /> Listen on {item.platform}
                    </span>
                    <span className="inline-flex items-center gap-1 text-ink-faint group-hover:text-pine transition-colors">
                      Open link <ExternalLink size={12} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Ethical Disclaimer and Crisis Support Banner */}
          <div className="bg-paper-deep/40 border border-paper-deep/90 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber/15 flex items-center justify-center text-amber-dark flex-shrink-0">
                <ShieldAlert size={20} strokeWidth={1.8} />
              </div>
              <div>
                <h4 className="font-display font-medium text-pine-deep text-base mb-1">
                  Important Educational & Medical Disclaimer
                </h4>
                <p className="text-xs text-ink-soft leading-relaxed mb-4">
                  The resources, tips, breathing exercises, and assessment metrics provided by MentalWell are intended solely for personal self-awareness, student lifestyle reflection, and academic stress management. They do not constitute clinical psychiatric diagnosis, medical advice, or formal therapy.
                </p>

                <div className="border-t border-paper-deep/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-soft">
                  <span className="font-medium text-pine-deep flex items-center gap-1.5">
                    <HeartHandshake size={15} className="text-pine" /> In immediate crisis or severe distress?
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                    <span className="bg-white/80 px-2 py-1 rounded border border-paper-deep/80">
                      US / CA: <strong>988</strong>
                    </span>
                    <span className="bg-white/80 px-2 py-1 rounded border border-paper-deep/80">
                      India: <strong>1800-599-0019 (KIRAN)</strong>
                    </span>
                    <span className="bg-white/80 px-2 py-1 rounded border border-paper-deep/80">
                      UK: <strong>111</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
