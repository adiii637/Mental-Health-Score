import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Smile,
  Meh,
  Frown,
  Trash2,
  Edit3,
  Lock,
  Calendar,
  AlertCircle,
  X,
  Check,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import Button from '../components/Button'
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../api/journal'

const moods = [
  {
    id: 'strained',
    label: 'Strained',
    desc: 'Feeling drained or overwhelmed',
    icon: Frown,
    color: 'text-coral',
    bg: 'bg-coral/10',
    border: 'border-coral/40',
    activeBg: 'bg-coral/15 ring-2 ring-coral',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    desc: 'Steady, grounded & managing',
    icon: Meh,
    color: 'text-amber-dark',
    bg: 'bg-amber/10',
    border: 'border-amber/40',
    activeBg: 'bg-amber/20 ring-2 ring-amber',
  },
  {
    id: 'strong',
    label: 'Strong',
    desc: 'Energized, focused & resilient',
    icon: Smile,
    color: 'text-sage-dark',
    bg: 'bg-sage/10',
    border: 'border-sage/40',
    activeBg: 'bg-sage/20 ring-2 ring-sage',
  },
]

export default function JournalPage() {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Composer / Editor state
  const [showComposer, setShowComposer] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedMood, setSelectedMood] = useState('balanced')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Filter state
  const [filterMood, setFilterMood] = useState('all')

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Load entries
  const loadEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJournalEntries({ limit: 50, offset: 0 })
      setEntries(data.journals || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err?.message || 'Could not load journal entries. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Open composer for new entry
  const handleOpenNew = () => {
    setEditingId(null)
    setSelectedMood('balanced')
    setTitle('')
    setContent('')
    setFormError(null)
    setShowComposer(true)
  }

  // Open composer to edit existing entry
  const handleEdit = (entry) => {
    setEditingId(entry.id)
    setSelectedMood(entry.mood)
    setTitle(entry.title || '')
    setContent(entry.content || '')
    setFormError(null)
    setShowComposer(true)
    window.scrollTo({ top: 120, behavior: 'smooth' })
  }

  // Submit new or edited entry
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) {
      setFormError('Please enter your journal reflection.')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      if (editingId) {
        // Update existing
        const updated = await updateJournalEntry(editingId, {
          mood: selectedMood,
          title: title.trim() || undefined,
          content: content.trim(),
        })
        setEntries((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item))
        )
      } else {
        // Create new
        const created = await createJournalEntry({
          mood: selectedMood,
          title: title.trim() || undefined,
          content: content.trim(),
        })
        setEntries((prev) => [created, ...prev])
        setTotal((prev) => prev + 1)
      }

      // Close composer
      setShowComposer(false)
      setEditingId(null)
      setTitle('')
      setContent('')
    } catch (err) {
      setFormError(err?.message || 'Failed to save journal entry.')
    } finally {
      setSaving(false)
    }
  }

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      await deleteJournalEntry(deleteTargetId)
      setEntries((prev) => prev.filter((item) => item.id !== deleteTargetId))
      setTotal((prev) => Math.max(0, prev - 1))
      setDeleteTargetId(null)
    } catch (err) {
      alert(err?.message || 'Failed to delete journal entry.')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered list
  const filteredEntries =
    filterMood === 'all'
      ? entries
      : entries.filter((item) => item.mood === filterMood)

  return (
    <div className="flex flex-col min-h-screen page-enter">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <Container>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="eyebrow">Personal Journal</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-pine bg-pine-tint px-2 py-0.5 rounded-full border border-pine/20">
                  <Lock size={10} /> Private & Isolated
                </span>
              </div>
              <h1 className="font-display font-medium text-pine-deep text-3xl sm:text-4xl">
                Daily Reflections & Mood
              </h1>
              <p className="text-ink-soft text-xs sm:text-sm mt-1">
                Reflect on your academic pacing, emotional state, and personal headspace.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleOpenNew}
              className="gap-2 shadow-sm"
            >
              <Plus size={16} /> New Entry
            </Button>
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-coral/10 border border-coral/25 flex items-center gap-3 text-coral text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                type="button"
                onClick={loadEntries}
                className="font-medium underline hover:text-coral-dark"
              >
                Retry
              </button>
            </div>
          )}

          {/* Composer Card (Create / Edit) */}
          {showComposer && (
            <div className="mb-10 bg-white/90 border border-pine/30 rounded-2xl p-6 sm:p-8 shadow-card animate-fadeIn">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-paper-deep/70">
                <div>
                  <h3 className="font-display font-medium text-pine-deep text-xl">
                    {editingId ? 'Edit Reflection' : 'New Journal Reflection'}
                  </h3>
                  <p className="text-xs text-ink-faint mt-0.5">
                    Your notes remain private to your authenticated account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="p-1.5 rounded-lg text-ink-faint hover:text-pine hover:bg-paper-deep/50 transition-colors"
                  aria-label="Close composer"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mb-5 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Mood Selection */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-ink-faint mb-2.5">
                    Select Your Current State
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {moods.map((m) => {
                      const Icon = m.icon
                      const isSelected = selectedMood === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMood(m.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex items-start gap-3 ${
                            isSelected
                              ? `${m.activeBg} border-transparent shadow-sm`
                              : `bg-paper/50 border-paper-deep hover:bg-white hover:border-paper-deep/90`
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0 ${m.color}`}
                          >
                            <Icon size={18} strokeWidth={2} />
                          </div>
                          <div>
                            <p className="font-display font-medium text-pine-deep text-sm">
                              {m.label}
                            </p>
                            <p className="text-[11px] text-ink-faint mt-0.5">
                              {m.desc}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title (Optional) */}
                <div>
                  <label
                    htmlFor="journal-title"
                    className="block text-xs font-mono uppercase tracking-wider text-ink-faint mb-1.5"
                  >
                    Entry Title <span className="normal-case text-ink-faint/70">(Optional)</span>
                  </label>
                  <input
                    id="journal-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Afternoon study break, Post-presentation calm"
                    className="w-full h-11 px-4 rounded-xl text-sm bg-paper/50 border border-paper-deep text-ink placeholder:text-ink-faint/60 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-all"
                  />
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="journal-content"
                      className="block text-xs font-mono uppercase tracking-wider text-ink-faint"
                    >
                      Reflection & Notes
                    </label>
                    <span className="text-[11px] font-mono text-ink-faint">
                      {content.length}/10,000
                    </span>
                  </div>
                  <textarea
                    id="journal-content"
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={10000}
                    placeholder="Write freely about your mood, study focus, sleep quality, or any emotional stressors on your mind…"
                    className="w-full p-4 rounded-xl text-sm bg-paper/50 border border-paper-deep text-ink placeholder:text-ink-faint/60 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-all leading-relaxed"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setShowComposer(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={saving || !content.trim()}
                    className="gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        {editingId ? 'Update Reflection' : 'Save Reflection'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-1.5 p-1 bg-paper-deep/40 rounded-xl border border-paper-deep/60">
              <button
                type="button"
                onClick={() => setFilterMood('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMood === 'all'
                    ? 'bg-white text-pine-deep shadow-sm'
                    : 'text-ink-soft hover:text-pine'
                }`}
              >
                All ({total})
              </button>
              {moods.map((m) => {
                const count = entries.filter((e) => e.mood === m.id).length
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFilterMood(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterMood === m.id
                        ? 'bg-white text-pine-deep shadow-sm'
                        : 'text-ink-soft hover:text-pine'
                    }`}
                  >
                    {m.label} ({count})
                  </button>
                )
              })}
            </div>

            <span className="text-xs font-mono text-ink-faint">
              Showing {filteredEntries.length} of {total} entries
            </span>
          </div>

          {/* Journal Entries List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card animate-pulse space-y-3"
                >
                  <div className="h-5 w-40 bg-paper-deep/60 rounded" />
                  <div className="h-4 w-full bg-paper-deep/40 rounded" />
                  <div className="h-4 w-2/3 bg-paper-deep/40 rounded" />
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            /* Empty State */
            <div className="bg-white/80 border border-paper-deep/80 rounded-2xl p-10 shadow-card text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-pine-tint flex items-center justify-center text-pine mb-4">
                <BookOpen size={26} strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-medium text-pine-deep text-lg mb-1">
                {filterMood === 'all'
                  ? 'No Journal Entries Yet'
                  : `No ${filterMood} entries found`}
              </h3>
              <p className="text-ink-soft text-xs max-w-sm mb-6 leading-relaxed">
                Take a mindful pause to record how your study sessions, energy levels, and emotions feel today.
              </p>
              <Button variant="primary" size="sm" onClick={handleOpenNew} className="gap-2">
                <Plus size={15} /> Write First Reflection
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const moodConfig =
                  moods.find((m) => m.id === entry.mood) || moods[1]
                const MoodIcon = moodConfig.icon

                const dateDisplay = entry.created_at
                  ? new Date(entry.created_at).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent'

                const timeDisplay = entry.created_at
                  ? new Date(entry.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''

                return (
                  <article
                    key={entry.id}
                    className="bg-white/80 border border-paper-deep/80 rounded-2xl p-6 shadow-card hover:border-pine/30 transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-paper-deep/60">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg ${moodConfig.bg} flex items-center justify-center ${moodConfig.color}`}
                        >
                          <MoodIcon size={15} strokeWidth={2} />
                        </div>
                        <span
                          className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${moodConfig.bg} ${moodConfig.color}`}
                        >
                          {moodConfig.label}
                        </span>
                        <span className="text-xs text-ink-faint flex items-center gap-1">
                          <Calendar size={12} /> {dateDisplay} {timeDisplay && `at ${timeDisplay}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded-lg text-ink-soft hover:text-pine hover:bg-pine-tint transition-colors text-xs flex items-center gap-1"
                          title="Edit reflection"
                          aria-label={`Edit ${entry.title || 'reflection'}`}
                        >
                          <Edit3 size={14} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(entry.id)}
                          className="p-1.5 rounded-lg text-ink-soft hover:text-coral hover:bg-coral/10 transition-colors text-xs flex items-center gap-1"
                          title="Delete reflection"
                          aria-label={`Delete ${entry.title || 'reflection'}`}
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>

                    {entry.title && (
                      <h3 className="font-display font-medium text-pine-deep text-base mb-2">
                        {entry.title}
                      </h3>
                    )}

                    <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {entry.content}
                    </p>
                  </article>
                )
              })}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteTargetId && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
            >
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-paper-deep">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center text-coral flex-shrink-0">
                    <Trash2 size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3
                      id="delete-dialog-title"
                      className="font-display font-medium text-pine-deep text-lg"
                    >
                      Delete Journal Entry?
                    </h3>
                    <p className="text-ink-soft text-xs mt-1 leading-relaxed">
                      Are you sure you want to delete this reflection? This action cannot be undone and will permanently remove it from your records.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-paper-deep/60">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTargetId(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="bg-coral hover:bg-coral-dark text-white border-coral"
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  )
}
