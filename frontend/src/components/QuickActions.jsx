import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  BookOpen,
  Wind,
  Compass,
  ArrowRight,
} from 'lucide-react'

const actions = [
  {
    title: 'Take Assessment',
    description: 'Calculate your updated mental health score and wellness category.',
    to: '/assessment',
    icon: ClipboardCheck,
    color: 'text-pine',
    bg: 'bg-pine-tint',
    primary: true,
  },
  {
    title: 'Write Journal',
    description: 'Log your private reflections and track your daily mood.',
    to: '/journal',
    icon: BookOpen,
    color: 'text-amber-dark',
    bg: 'bg-amber/12',
    primary: false,
  },
  {
    title: 'Breathing Exercise',
    description: 'Practice interactive 4-7-8 guided breathing for immediate calm.',
    to: '/resources',
    icon: Wind,
    color: 'text-sage',
    bg: 'bg-sage/12',
    primary: false,
  },
  {
    title: 'Wellness Guides',
    description: 'Explore practical sleep, study-life, and digital wellbeing tips.',
    to: '/resources',
    icon: Compass,
    color: 'text-pine',
    bg: 'bg-pine-tint',
    primary: false,
  },
]

export default function QuickActions() {
  return (
    <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card">
      <div className="mb-4">
        <h3 className="font-display font-medium text-pine-deep text-lg">
          Quick Actions
        </h3>
        <p className="text-ink-faint text-xs mt-0.5">
          Frequently used wellness tools and check-ins
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => {
          const Icon = act.icon

          return (
            <Link
              key={act.title}
              to={act.to}
              className={`rounded-xl p-4 flex flex-col justify-between transition-all duration-200 border group ${
                act.primary
                  ? 'bg-pine text-white border-pine shadow-sm hover:bg-pine-deep hover:shadow-md'
                  : 'bg-paper/50 border-paper-deep/70 hover:bg-white hover:border-pine/30 hover:shadow-card'
              }`}
            >
              <div>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    act.primary ? 'bg-white/15 text-white' : `${act.bg} ${act.color}`
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <h4
                  className={`font-display font-medium text-sm mb-1 ${
                    act.primary ? 'text-white' : 'text-pine-deep'
                  }`}
                >
                  {act.title}
                </h4>
                <p
                  className={`text-xs leading-relaxed ${
                    act.primary ? 'text-white/80' : 'text-ink-soft'
                  }`}
                >
                  {act.description}
                </p>
              </div>

              <div
                className={`mt-3 pt-2 flex items-center justify-between text-xs font-medium ${
                  act.primary ? 'text-white/90 border-t border-white/15' : 'text-pine border-t border-paper-deep/60'
                }`}
              >
                <span>Launch</span>
                <ArrowRight
                  size={13}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
