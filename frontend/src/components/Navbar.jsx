import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Leaf, ChevronRight, LogOut, LayoutDashboard, User } from 'lucide-react'
import Button from './Button'
import Container from './Container'
import { useAuth } from '../hooks/useAuth'

const navLinks = [
  { to: '/assessment', label: 'Assessment' },
  { to: '/chat', label: 'Wellness Chat' },
  { to: '/journal', label: 'Journal' },
  { to: '/community', label: 'Community' },
  { to: '/resources', label: 'Resources' },
]

/** Desktop auth buttons — auth-aware */
function NavbarAuth() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  if (isAuthenticated) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <Link
          to="/profile"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-ink-soft hover:text-pine hover:bg-pine-tint/60 transition-colors"
          title="View profile"
        >
          <div className="w-6 h-6 rounded-full bg-pine text-white flex items-center justify-center text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="font-medium text-pine-deep">{user?.name?.split(' ')[0]}</span>
        </Link>
        <Button variant="ghost" size="sm" to="/dashboard">
          <LayoutDashboard size={15} className="mr-1.5" />
          Dashboard
        </Button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-soft hover:text-coral hover:bg-coral/10 transition-all duration-200"
          aria-label="Log out"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      <Button variant="ghost" size="sm" to="/login">
        Sign In
      </Button>
      <Button variant="primary" size="sm" to="/register">
        Get Started
      </Button>
    </div>
  )
}

/** Mobile auth section — auth-aware */
function MobileNavbarAuth() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  if (isAuthenticated) {
    return (
      <div className="flex flex-col gap-2 pt-4">
        <p className="text-xs text-ink-faint px-2 mb-1">
          Signed in as{' '}
          <span className="text-pine font-medium">{user?.name}</span>
        </p>
        <Button variant="outline" size="md" fullWidth to="/dashboard">
          Dashboard
        </Button>
        <Button variant="ghost" size="md" fullWidth to="/profile">
          Profile Settings
        </Button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-ink-soft border border-paper-deep hover:text-coral hover:border-coral/40 hover:bg-coral/5 transition-all duration-200"
        >
          Log Out
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 pt-4">
      <Button variant="outline" size="md" fullWidth to="/login">
        Sign In
      </Button>
      <Button variant="primary" size="md" fullWidth to="/register">
        Get Started
      </Button>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  /* Close menu on route change */
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  /* Detect scroll for backdrop blur */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-paper/90 backdrop-blur-md border-b border-paper-deep/70 shadow-sm'
          : 'bg-transparent',
      ].join(' ')}
      role="banner"
    >
      <Container>
        <nav
          className="flex items-center justify-between h-16"
          aria-label="Main navigation"
        >
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-lg px-1"
            aria-label="MentalWell – Home"
          >
            <div className="w-8 h-8 bg-pine rounded-lg flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Leaf size={16} strokeWidth={2} className="text-white" />
            </div>
            <span className="font-display font-medium text-pine-deep text-lg tracking-tight">
              MentalWell
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    [
                      'px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-pine bg-pine-tint'
                        : 'text-ink-soft hover:text-pine hover:bg-pine-tint/60',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop CTA buttons (auth-aware) */}
          <NavbarAuth />

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-ink-soft hover:text-pine hover:bg-pine-tint transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </Container>

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        className={[
          'md:hidden overflow-hidden transition-all duration-300 ease-smooth',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
        aria-hidden={!open}
      >
        <div className="bg-paper/95 backdrop-blur-md border-t border-paper-deep/70 pb-4">
          <Container>
            <ul className="flex flex-col pt-2" role="list">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      [
                        'flex items-center justify-between py-3 px-2 text-sm font-medium border-b border-paper-deep/60 transition-colors duration-200',
                        isActive ? 'text-pine' : 'text-ink-soft hover:text-pine',
                      ].join(' ')
                    }
                  >
                    <span>{label}</span>
                    <ChevronRight size={14} className="text-ink-faint" />
                  </NavLink>
                </li>
              ))}
            </ul>
            <MobileNavbarAuth />
          </Container>
        </div>
      </div>
    </header>
  )
}
