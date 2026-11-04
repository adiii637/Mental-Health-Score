import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Compass,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import Button from '../components/Button'
import { updateUserProfile } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user, logout, updateUserState } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Name cannot be blank.')
      return
    }

    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const updated = await updateUserProfile({ name: name.trim() })
      updateUserState(updated)
      setSuccessMsg('Your profile name has been updated successfully.')
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active'

  return (
    <div className="flex flex-col min-h-screen page-enter">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <Container size="narrow">
          {/* Header */}
          <div className="mb-8">
            <span className="eyebrow mb-1.5">Account & Identity</span>
            <h1 className="font-display font-medium text-pine-deep text-3xl sm:text-4xl">
              User Profile
            </h1>
            <p className="text-ink-soft text-xs sm:text-sm mt-1">
              Manage your authenticated profile details and application preferences.
            </p>
          </div>

          {/* Feedback Banners */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-sage/15 border border-sage/30 text-sage-dark text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 size={16} className="text-sage flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-coral/10 border border-coral/25 text-coral text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 sm:p-8 shadow-card mb-8">
            <div className="flex items-center gap-4 pb-6 mb-6 border-b border-paper-deep/60">
              <div className="w-14 h-14 rounded-2xl bg-pine flex items-center justify-center text-white font-display text-2xl shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="font-display font-medium text-pine-deep text-xl">
                  {user?.name || 'Student User'}
                </h2>
                <p className="text-xs text-ink-faint font-mono">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sage-dark bg-sage/12 px-2 py-0.5 rounded-full border border-sage/20">
                    <ShieldCheck size={11} /> Authenticated Student
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleUpdateName} className="space-y-5">
              <div>
                <label
                  htmlFor="user-name"
                  className="block text-xs font-mono uppercase tracking-wider text-ink-faint mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                    <User size={16} />
                  </div>
                  <input
                    id="user-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={1}
                    maxLength={100}
                    placeholder="Your name"
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-paper/50 border border-paper-deep text-ink placeholder:text-ink-faint/60 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-email"
                  className="block text-xs font-mono uppercase tracking-wider text-ink-faint mb-1.5"
                >
                  Email Address <span className="normal-case text-ink-faint/70">(Read-only)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint">
                    <Mail size={16} />
                  </div>
                  <input
                    id="user-email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-paper-deep/30 border border-paper-deep text-ink-faint cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[11px] text-ink-faint mt-1">
                  Email addresses are unique account identifiers verified at registration.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={saving || name.trim() === user?.name}
                  className="gap-2"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* Account Meta & Security Details */}
          <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card mb-8">
            <h3 className="font-display font-medium text-pine-deep text-base mb-4">
              Security & Workspace Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-paper/50 border border-paper-deep/60">
                <div className="flex items-center gap-2 text-ink-faint mb-1">
                  <Calendar size={13} />
                  <span className="font-mono text-[11px] uppercase tracking-wider">
                    Member Since
                  </span>
                </div>
                <p className="font-medium text-pine-deep">{memberSince}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-paper/50 border border-paper-deep/60">
                <div className="flex items-center gap-2 text-ink-faint mb-1">
                  <ShieldCheck size={13} />
                  <span className="font-mono text-[11px] uppercase tracking-wider">
                    Data Isolation
                  </span>
                </div>
                <p className="font-medium text-pine-deep">JWT-scoped to your user record</p>
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation */}
          <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card mb-8">
            <h3 className="font-display font-medium text-pine-deep text-base mb-3">
              Application Navigation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Link
                to="/dashboard"
                className="p-3 rounded-xl bg-paper/50 border border-paper-deep/60 hover:bg-white hover:border-pine/30 transition-all flex flex-col items-center gap-2 text-center group"
              >
                <LayoutDashboard size={18} className="text-pine group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-pine-deep">Dashboard</span>
              </Link>
              <Link
                to="/assessment"
                className="p-3 rounded-xl bg-paper/50 border border-paper-deep/60 hover:bg-white hover:border-pine/30 transition-all flex flex-col items-center gap-2 text-center group"
              >
                <ClipboardList size={18} className="text-pine group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-pine-deep">Assessment</span>
              </Link>
              <Link
                to="/journal"
                className="p-3 rounded-xl bg-paper/50 border border-paper-deep/60 hover:bg-white hover:border-pine/30 transition-all flex flex-col items-center gap-2 text-center group"
              >
                <BookOpen size={18} className="text-pine group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-pine-deep">Journal</span>
              </Link>
              <Link
                to="/resources"
                className="p-3 rounded-xl bg-paper/50 border border-paper-deep/60 hover:bg-white hover:border-pine/30 transition-all flex flex-col items-center gap-2 text-center group"
              >
                <Compass size={18} className="text-pine group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-pine-deep">Resources</span>
              </Link>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl border border-coral/30 text-coral bg-coral/5 hover:bg-coral/10 hover:border-coral/50 transition-all duration-200 text-xs font-medium flex items-center gap-2"
            >
              <LogOut size={14} />
              Sign Out of MentalWell
            </button>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
