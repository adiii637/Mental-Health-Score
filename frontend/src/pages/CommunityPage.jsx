import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Users,
  Plus,
  Heart,
  MessageCircle,
  Trash2,
  Send,
  Tag,
  AlertCircle,
  X,
  ChevronDown,
  Shield,
  UserCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import Button from '../components/Button'
import {
  getPosts,
  createPost,
  deletePost,
  getComments,
  createComment,
  deleteComment,
  toggleSupport,
} from '../api/community'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'All',
  'General',
  'Anxiety',
  'Stress',
  'Depression',
  'Relationships',
  'Academic',
  'Self-Care',
  'Gratitude',
]

const CATEGORY_COLORS = {
  General:       { bg: 'bg-pine/10',   text: 'text-pine',       border: 'border-pine/20' },
  Anxiety:       { bg: 'bg-amber/10',  text: 'text-amber-dark', border: 'border-amber/30' },
  Stress:        { bg: 'bg-coral/10',  text: 'text-coral',      border: 'border-coral/30' },
  Depression:    { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  Relationships: { bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-200' },
  Academic:      { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  'Self-Care':   { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-200' },
  Gratitude:     { bg: 'bg-sage/10',   text: 'text-sage-dark',  border: 'border-sage/30' },
}

function categoryStyle(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.General
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CategoryPill({ cat, active, onClick }) {
  return (
    <button
      onClick={() => onClick(cat)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-pine text-white border-pine shadow-sm'
          : 'bg-white/70 text-ink/70 border-ink/10 hover:border-pine/40 hover:text-pine'
      }`}
    >
      {cat}
    </button>
  )
}

function CommentsPanel({ post, onClose }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getComments(post.id)
      setComments(data.comments || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [post.id])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const c = await createComment(post.id, { content: text.trim(), is_anonymous: isAnon })
      setComments((prev) => [...prev, c])
      setText('')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-paper w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-pine" />
            <span className="font-semibold text-ink text-sm">
              Comments on post
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ink/8 text-ink/50 hover:text-ink transition-colors"
            aria-label="Close comments"
          >
            <X size={16} />
          </button>
        </div>

        {/* Original post preview */}
        <div className="px-5 py-3 bg-pine/5 border-b border-ink/8">
          <p className="text-xs text-ink/60 line-clamp-2">{post.content}</p>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0">
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-pine" size={24} />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-center text-ink/40 text-sm py-6">
              No comments yet. Be the first to show support!
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="bg-white/60 border border-ink/8 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-pine">
                      {c.author_display}
                    </span>
                    {c.is_anonymous && (
                      <Shield size={11} className="text-ink/30" />
                    )}
                    <span className="text-xs text-ink/35 ml-auto">
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-ink/80 leading-relaxed">{c.content}</p>
                </div>
                {c.is_own_comment && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="p-1 rounded hover:bg-coral/10 text-ink/30 hover:text-coral transition-colors shrink-0"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mb-2 flex items-center gap-2 bg-coral/10 border border-coral/30 text-coral text-xs rounded-lg px-3 py-2">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Compose comment */}
        <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-ink/8 space-y-2">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a supportive comment…"
              maxLength={1000}
              className="flex-1 bg-white border border-ink/15 rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-pine/40"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="p-2.5 rounded-xl bg-pine text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pine-deep transition-colors"
              aria-label="Send comment"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink/50 hover:text-ink/70 transition-colors w-fit">
            <input
              type="checkbox"
              checked={isAnon}
              onChange={(e) => setIsAnon(e.target.checked)}
              className="rounded accent-pine"
            />
            <Shield size={11} /> Post anonymously
          </label>
        </form>
      </div>
    </div>
  )
}

function PostCard({ post, onSupport, onDelete, onOpenComments }) {
  const [supporting, setSupporting] = useState(false)
  const cs = categoryStyle(post.category)

  async function handleSupport() {
    if (supporting) return
    setSupporting(true)
    await onSupport(post.id)
    setSupporting(false)
  }

  return (
    <article className="card-glass p-5 hover:shadow-md transition-all duration-200 group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-pine/10 flex items-center justify-center text-pine font-semibold text-xs shrink-0">
            {post.is_anonymous ? '?' : post.author_display.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-ink/80">
                {post.author_display}
              </span>
              {post.is_anonymous && (
                <Shield size={11} className="text-ink/30" title="Anonymous post" />
              )}
              {post.is_own_post && (
                <span className="text-[10px] font-mono bg-pine/10 text-pine px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink/35">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Category badge */}
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cs.bg} ${cs.text} ${cs.border}`}
          >
            {post.category}
          </span>
          {/* Delete own post */}
          {post.is_own_post && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-lg text-ink/25 hover:text-coral hover:bg-coral/10 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete post"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-ink/75 leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-ink/6 pt-3">
        {/* Support */}
        <button
          onClick={handleSupport}
          disabled={supporting}
          className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-200 ${
            post.has_supported
              ? 'text-coral'
              : 'text-ink/40 hover:text-coral'
          } disabled:opacity-60`}
          aria-label="Toggle support"
        >
          <Heart
            size={15}
            className={`transition-all duration-200 ${post.has_supported ? 'fill-coral' : ''}`}
          />
          <span>{post.support_count}</span>
        </button>

        {/* Comments */}
        <button
          onClick={() => onOpenComments(post)}
          className="flex items-center gap-1.5 text-xs font-medium text-ink/40 hover:text-pine transition-colors"
          aria-label="View comments"
        >
          <MessageCircle size={15} />
          <span>{post.comment_count}</span>
        </button>
      </div>
    </article>
  )
}

function CreatePostModal({ onClose, onCreated }) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [isAnon, setIsAnon] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const LIMIT = 2000
  const remaining = LIMIT - content.length

  async function handleSubmit(e) {
    e.preventDefault()
    if (content.trim().length < 10) {
      setError('Please write at least 10 characters.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const post = await createPost({
        content: content.trim(),
        category,
        is_anonymous: isAnon,
      })
      onCreated(post)
      onClose()
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-paper w-full max-w-lg rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-pine" />
            <span className="font-semibold text-ink">Share with the community</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ink/8 text-ink/50 hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Content textarea */}
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your feelings, experiences, or ask for support from your peers…"
              rows={5}
              maxLength={LIMIT}
              className="w-full bg-white border border-ink/15 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-pine/40 resize-none leading-relaxed"
            />
            <p className={`text-[11px] mt-1 text-right ${remaining < 100 ? 'text-coral' : 'text-ink/30'}`}>
              {remaining} characters remaining
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-ink/60 mb-1.5">
              <Tag size={11} className="inline mr-1" />Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none bg-white border border-ink/15 rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-pine/40 pr-9"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
            </div>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none p-3 bg-white/60 border border-ink/10 rounded-xl hover:border-pine/30 transition-colors">
            <input
              type="checkbox"
              checked={isAnon}
              onChange={(e) => setIsAnon(e.target.checked)}
              className="rounded accent-pine w-4 h-4"
            />
            <div>
              <p className="text-sm font-medium text-ink/80 flex items-center gap-1.5">
                <Shield size={13} className="text-pine" /> Post anonymously
              </p>
              <p className="text-[11px] text-ink/45">
                Your name will not be shown to other students
              </p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-coral/10 border border-coral/30 text-coral text-xs rounded-lg px-3 py-2">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={submitting || content.trim().length < 10}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Posting…
                </span>
              ) : (
                'Share Post'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15

export default function CommunityPage() {
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const [activeCategory, setActiveCategory] = useState('All')
  const [myPostsOnly, setMyPostsOnly] = useState(false)
  const [offset, setOffset] = useState(0)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [commentsPost, setCommentsPost] = useState(null)

  // Delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadPosts = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset
      if (reset) setLoading(true)
      else setLoadingMore(true)
      setError(null)

      try {
        const data = await getPosts({
          category: activeCategory !== 'All' ? activeCategory : null,
          limit: PAGE_SIZE,
          offset: currentOffset,
          myPosts: myPostsOnly,
        })
        if (reset) {
          setPosts(data.posts || [])
        } else {
          setPosts((prev) => [...prev, ...(data.posts || [])])
        }
        setTotal(data.total || 0)
        if (!reset) setOffset(currentOffset + PAGE_SIZE)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory, myPostsOnly, offset]
  )

  // When filters change, reset
  useEffect(() => {
    setOffset(0)
    setLoading(true)
    setError(null)

    const cat = activeCategory !== 'All' ? activeCategory : null
    getPosts({ category: cat, limit: PAGE_SIZE, offset: 0, myPosts: myPostsOnly })
      .then((data) => {
        setPosts(data.posts || [])
        setTotal(data.total || 0)
        setOffset(PAGE_SIZE)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, myPostsOnly])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleSupport(postId) {
    try {
      const result = await toggleSupport(postId)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, support_count: result.support_count, has_supported: result.has_supported }
            : p
        )
      )
    } catch (_) {
      /* silent — network issues shouldn't break the UI */
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      await deletePost(deleteTargetId)
      setPosts((prev) => prev.filter((p) => p.id !== deleteTargetId))
      setTotal((t) => Math.max(0, t - 1))
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
      setDeleteTargetId(null)
    }
  }

  function handlePostCreated(newPost) {
    // Prepend to current list if no filters applied or it matches
    if (
      !myPostsOnly ||
      newPost.is_own_post
    ) {
      if (
        activeCategory === 'All' ||
        newPost.category === activeCategory
      ) {
        setPosts((prev) => [newPost, ...prev])
        setTotal((t) => t + 1)
      }
    }
  }

  const hasMore = posts.length < total

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 page-enter relative z-10">
        {/* Hero */}
        <section className="bg-gradient-to-b from-pine/8 to-transparent pt-16 pb-10">
          <Container>
            <div className="max-w-2xl">
              <span className="eyebrow mb-4">
                <Users size={12} /> Peer Support Community
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-ink mb-3">
                You're Not Alone
              </h1>
              <p className="text-ink/55 text-base leading-relaxed">
                A safe space to share your experiences, find solidarity and
                support your fellow students — anonymously if you prefer.
              </p>
            </div>
          </Container>
        </section>

        <Container className="mt-8">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Category filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <CategoryPill
                  key={cat}
                  cat={cat}
                  active={activeCategory === cat && !myPostsOnly}
                  onClick={(c) => {
                    setActiveCategory(c)
                    setMyPostsOnly(false)
                  }}
                />
              ))}
              <button
                onClick={() => {
                  setMyPostsOnly((v) => !v)
                  setActiveCategory('All')
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  myPostsOnly
                    ? 'bg-amber/80 text-ink border-amber shadow-sm'
                    : 'bg-white/70 text-ink/60 border-ink/10 hover:border-amber/50 hover:text-amber-dark'
                }`}
              >
                <UserCheck size={12} /> My Posts
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setOffset(0)
                  setLoading(true)
                  const cat = activeCategory !== 'All' ? activeCategory : null
                  getPosts({ category: cat, limit: PAGE_SIZE, offset: 0, myPosts: myPostsOnly })
                    .then((data) => {
                      setPosts(data.posts || [])
                      setTotal(data.total || 0)
                      setOffset(PAGE_SIZE)
                    })
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false))
                }}
                className="p-2 rounded-xl border border-ink/10 bg-white/70 text-ink/50 hover:text-pine hover:border-pine/30 transition-colors"
                title="Refresh posts"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-pine text-white text-sm font-medium rounded-xl hover:bg-pine-deep transition-colors shadow-sm"
              >
                <Plus size={15} /> New Post
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-1.5 mb-6 text-xs text-ink/40">
            <span>{total} post{total !== 1 ? 's' : ''}</span>
            {activeCategory !== 'All' && !myPostsOnly && (
              <><span>·</span><span className="text-pine">{activeCategory}</span></>
            )}
            {myPostsOnly && (
              <><span>·</span><span className="text-amber-dark">Your posts</span></>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-coral/10 border border-coral/30 text-coral text-sm rounded-xl px-4 py-3 mb-6">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card-glass p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-ink/8" />
                    <div className="space-y-1.5">
                      <div className="w-24 h-3 rounded bg-ink/8" />
                      <div className="w-14 h-2.5 rounded bg-ink/5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-ink/6 w-full" />
                    <div className="h-3 rounded bg-ink/6 w-4/5" />
                    <div className="h-3 rounded bg-ink/6 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-pine/10 flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-pine/50" />
              </div>
              <h3 className="font-semibold text-ink/60 mb-2">No posts yet</h3>
              <p className="text-sm text-ink/40 mb-6">
                {myPostsOnly
                  ? "You haven't shared anything yet."
                  : 'Be the first to share in this community.'}
              </p>
              <button
                onClick={() => { setShowCreateModal(true); setMyPostsOnly(false) }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-pine text-white text-sm font-medium rounded-xl hover:bg-pine-deep transition-colors"
              >
                <Plus size={15} /> Share something
              </button>
            </div>
          )}

          {/* Post list */}
          {!loading && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSupport={handleSupport}
                  onDelete={(id) => setDeleteTargetId(id)}
                  onOpenComments={(p) => setCommentsPost(p)}
                />
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => {
                      setLoadingMore(true)
                      const cat = activeCategory !== 'All' ? activeCategory : null
                      getPosts({ category: cat, limit: PAGE_SIZE, offset, myPosts: myPostsOnly })
                        .then((data) => {
                          setPosts((prev) => [...prev, ...(data.posts || [])])
                          setTotal(data.total || 0)
                          setOffset((o) => o + PAGE_SIZE)
                        })
                        .catch((e) => setError(e.message))
                        .finally(() => setLoadingMore(false))
                    }}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-6 py-2.5 border border-ink/15 rounded-xl text-sm text-ink/60 hover:border-pine/40 hover:text-pine transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <><Loader2 size={14} className="animate-spin" /> Loading…</>
                    ) : (
                      'Load more posts'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </Container>
      </main>

      {/* ---- Modals ---- */}

      {/* Create post */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
        />
      )}

      {/* Comments panel */}
      {commentsPost && (
        <CommentsPanel
          post={commentsPost}
          onClose={() => setCommentsPost(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-paper w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="font-semibold text-ink mb-2">Delete Post?</h3>
            <p className="text-sm text-ink/55 mb-5">
              This will permanently remove your post and all its comments and reactions.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral/90 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
