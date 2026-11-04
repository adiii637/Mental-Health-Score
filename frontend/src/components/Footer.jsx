import { Link } from 'react-router-dom'
import { Leaf, Heart, Github, ArrowUpRight } from 'lucide-react'
import Container from './Container'

const footerLinks = {
  Product: [
    { label: 'Assessment', to: '/assessment' },
    { label: 'Wellness Chat', to: '/chat' },
    { label: 'Journal', to: '/journal' },
    { label: 'Resources', to: '/resources' },
    { label: 'Dashboard', to: '/dashboard' },
  ],
  Account: [
    { label: 'Profile Settings', to: '/profile' },
    { label: 'Sign In', to: '/login' },
    { label: 'Create Account', to: '/register' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Use', to: '#' },
    { label: 'Disclaimer', to: '#' },
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-pine-deep text-white mt-24" role="contentinfo">
      {/* Disclaimer banner */}
      <div className="bg-amber/10 border-b border-amber/20">
        <Container>
          <div className="py-4 flex items-start gap-3">
            <Heart
              size={16}
              className="text-amber flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-white/70 text-xs leading-relaxed">
              <strong className="text-amber font-medium">Responsible Use Notice: </strong>
              MentalWell provides educational wellness analytics based on lifestyle habits. It is{' '}
              <strong className="text-white/90">not a clinical diagnostic tool</strong> and does not
              replace professional mental health evaluation or treatment. If you are in crisis or
              experiencing severe distress, please contact a qualified mental health professional or
              call a crisis helpline immediately.
            </p>
          </div>
        </Container>
      </div>

      {/* Main footer grid */}
      <Container className="py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 group w-fit"
              aria-label="MentalWell – Home"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/15 transition-colors duration-200">
                <Leaf size={16} strokeWidth={2} className="text-sage-light" />
              </div>
              <span className="font-display font-medium text-white text-lg tracking-tight">
                MentalWell
              </span>
            </Link>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              An evidence-informed wellness analytics platform helping students
              understand how daily habits shape their mental well-being.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <a
                href="https://github.com/tanishq-latent/Mental-Health-Score"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs transition-colors duration-200"
                aria-label="View source on GitHub (opens in new tab)"
              >
                <Github size={14} />
                <span>View on GitHub</span>
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group} className="flex flex-col gap-3">
              <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-white/35">
                {group}
              </h3>
              <ul className="flex flex-col gap-2" role="list">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-white/55 hover:text-white text-sm transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-10 mt-10 border-t border-white/10">
          <p className="text-white/30 text-xs font-mono">
            © {year} MentalWell. For educational and research purposes only.
          </p>
          <p className="text-white/25 text-xs flex items-center gap-1.5">
            Built with <Heart size={10} className="text-coral/60" aria-label="love" /> for student wellness
          </p>
        </div>
      </Container>
    </footer>
  )
}
