import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageCircleHeart,
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  PhoneCall,
  History,
  X,
  RefreshCw,
  ShieldCheck,
  Compass,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import {
  sendChatMessage,
  getChatSessions,
  getChatSession,
  deleteChatSession,
} from '../api/chat'

const SUGGESTED_PROMPTS = [
  {
    title: 'Feeling Stressed',
    text: "I've been feeling stressed lately.",
    desc: 'Explore gentle grounding and breath exercises',
    emoji: '🌱',
  },
  {
    title: 'Sleep Routine',
    text: 'Help me improve my sleep routine.',
    desc: 'Practical habits to wind down naturally',
    emoji: '🌙',
  },
  {
    title: 'Study Pressure',
    text: 'I feel overwhelmed with my studies.',
    desc: 'Pacing, pomodoro, and focus balance',
    emoji: '📚',
  },
  {
    title: 'Daily Wellness',
    text: 'Suggest a simple daily wellness routine.',
    desc: 'Small actionable steps for balance',
    emoji: '✨',
  },
]

/**
 * Safely render inline bold formatting from markdown (**text**)
 */
function renderInlineFormatted(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-pine-deep">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

/**
 * Render structured message contents with markdown-like parsing (paragraphs, lists, hotlines)
 */
function FormattedMessage({ content }) {
  if (!content) return null

  // Split into paragraphs by double newline
  const blocks = content.split(/\n\n+/)

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        // Check for crisis hotline callout in block
        const isCrisisInfo =
          trimmed.includes('988') ||
          trimmed.includes('Tele-MANAS') ||
          trimmed.includes('Lifeline') ||
          trimmed.includes('emergency') ||
          trimmed.includes('85258')

        // Check if block is a bullet list (lines starting with - or * or •)
        const lines = trimmed.split('\n')
        const isList =
          lines.length > 1 &&
          lines.every((line) => /^\s*[-*•]\s+/.test(line) || line.trim() === '')

        if (isList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-2 my-2">
              {lines
                .filter((l) => l.trim().length > 0)
                .map((line, lIdx) => {
                  const cleaned = line.replace(/^\s*[-*•]\s+/, '')
                  return (
                    <li key={lIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pine/70 mt-2 flex-shrink-0" />
                      <span>{renderInlineFormatted(cleaned)}</span>
                    </li>
                  )
                })}
            </ul>
          )
        }

        // Render crisis helpline highlight card
        if (isCrisisInfo && (trimmed.includes('Call') || trimmed.includes('text') || trimmed.includes('988'))) {
          return (
            <div
              key={bIdx}
              className="my-3 p-3.5 bg-amber/12 border border-amber/35 rounded-xl text-ink flex items-start gap-3 shadow-sm"
            >
              <PhoneCall size={18} className="text-amber-dark flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 leading-relaxed">
                <p className="font-medium text-amber-dark">Immediate Crisis & Support Resources</p>
                <div>{renderInlineFormatted(trimmed)}</div>
              </div>
            </div>
          )
        }

        // Normal paragraph (may have single linebreaks)
        return (
          <p key={bIdx}>
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                {renderInlineFormatted(line)}
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

export default function ChatPage() {
  const { user } = useAuth()

  // State
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isLoadingSessionsList, setIsLoadingSessionsList] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isConfigError, setIsConfigError] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending, scrollToBottom])

  // Load chat sessions on mount
  const fetchSessions = useCallback(async () => {
    try {
      setIsLoadingSessionsList(true)
      const data = await getChatSessions({ limit: 50, offset: 0 })
      setSessions(data.sessions || [])
    } catch (err) {
      console.warn('Failed to load chat sessions:', err.message)
    } finally {
      setIsLoadingSessionsList(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Switch to an existing session
  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId) {
      setIsMobileSidebarOpen(false)
      return
    }

    try {
      setIsLoadingSession(true)
      setErrorMessage(null)
      setIsConfigError(false)
      setActiveSessionId(sessionId)
      setIsMobileSidebarOpen(false)

      const sessionData = await getChatSession(sessionId)
      setMessages(sessionData.messages || [])
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load conversation history.')
    } finally {
      setIsLoadingSession(false)
    }
  }

  // Start a new session
  const handleNewSession = () => {
    setActiveSessionId(null)
    setMessages([])
    setErrorMessage(null)
    setIsConfigError(false)
    setInputMessage('')
    setIsMobileSidebarOpen(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Delete a session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation()
    const confirmDelete = window.confirm('Are you sure you want to delete this conversation?')
    if (!confirmDelete) return

    try {
      await deleteChatSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))

      // If active session was deleted, start fresh
      if (activeSessionId === sessionId) {
        handleNewSession()
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete conversation.')
    }
  }

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isSending) return

    setErrorMessage(null)
    setIsConfigError(false)

    // Optimistically append user message to UI
    const optimisticUserMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUserMsg])
    setInputMessage('')
    setIsSending(true)

    try {
      const response = await sendChatMessage({
        message: text,
        sessionId: activeSessionId,
      })

      // Update active session ID if this was a new conversation
      if (!activeSessionId && response.session_id) {
        setActiveSessionId(response.session_id)
      }

      // Append assistant response
      setMessages((prev) => [
        ...prev.filter((m) => m !== optimisticUserMsg),
        response.user_message,
        response.assistant_message,
      ])

      // Refresh sessions list in background to show updated title / time
      fetchSessions()
    } catch (err) {
      // Revert optimistic user message on failure so user can retry
      setMessages((prev) => prev.filter((m) => m !== optimisticUserMsg))
      setInputMessage(text) // Restore typed message

      if (err.status === 503 && err.message?.toLowerCase().includes('gemini api key')) {
        setIsConfigError(true)
        setErrorMessage(
          'Google Gemini API key is not configured in backend/.env. Please add GEMINI_API_KEY=your_key to backend/.env and restart the backend server.'
        )
      } else if (err.status === 502 && err.message?.toLowerCase().includes('invalid')) {
        setIsConfigError(true)
        setErrorMessage(
          'The configured Gemini API key appears invalid. Please verify GEMINI_API_KEY in backend/.env.'
        )
      } else {
        setErrorMessage(err.message || 'Unable to get response from AI. Please try again.')
      }
    } finally {
      setIsSending(false)
    }
  }

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const formatSessionDate = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMs = now - date
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex flex-col min-h-screen page-enter bg-paper">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <Container size="wide">
          {/* Top navigation row */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-pine transition-colors duration-200 group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
              Back to Dashboard
            </Link>

            {/* Mobile History Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/80 border border-paper-deep text-pine-deep hover:bg-pine-tint transition-colors shadow-sm"
            >
              <History size={14} />
              Conversations ({sessions.length})
            </button>
          </div>

          {/* Main Chat Layout Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ============================================================
                LEFT SIDEBAR: Conversation History (Desktop)
                ============================================================ */}
            <aside className="hidden lg:flex lg:col-span-4 flex-col bg-white/75 backdrop-blur-sm border border-paper-deep/80 rounded-2xl shadow-card overflow-hidden h-[740px]">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-paper-deep/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pine-tint text-pine flex items-center justify-center">
                    <History size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-display font-medium text-pine-deep">Conversations</h2>
                    <p className="text-[11px] text-ink-faint">
                      {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} saved
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNewSession}
                  className="!px-3 !h-8 text-xs gap-1.5"
                  title="Start a new conversation"
                >
                  <Plus size={14} />
                  New Chat
                </Button>
              </div>

              {/* Sidebar Sessions List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {isLoadingSessionsList ? (
                  <div className="flex flex-col items-center justify-center h-48 text-ink-faint text-xs gap-2">
                    <RefreshCw size={16} className="animate-spin text-pine" />
                    <span>Loading conversations…</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-6 text-center text-ink-faint text-xs space-y-2">
                    <Compass size={24} className="mx-auto text-pine/40 mb-1" />
                    <p className="font-medium text-ink-soft">No conversations yet</p>
                    <p>Your wellness chats will appear here automatically.</p>
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isActive = sess.id === activeSessionId
                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSession(sess.id)}
                        className={`group relative flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border text-left ${
                          isActive
                            ? 'bg-pine-tint/90 border-pine/30 shadow-xs'
                            : 'bg-white/50 hover:bg-paper/70 border-transparent hover:border-paper-deep/80'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p
                            className={`text-xs font-medium truncate ${
                              isActive ? 'text-pine-deep font-semibold' : 'text-ink'
                            }`}
                          >
                            {sess.title || 'Wellness Chat'}
                          </p>
                          {sess.last_message && (
                            <p className="text-[11px] text-ink-faint truncate mt-0.5">
                              {sess.last_message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-faint">
                            <span>{formatSessionDate(sess.updated_at)}</span>
                            <span>•</span>
                            <span>{sess.message_count} msgs</span>
                          </div>
                        </div>

                        {/* Delete Session Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(e, sess.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink-faint hover:text-coral hover:bg-coral/10 transition-all flex-shrink-0"
                          title="Delete conversation"
                          aria-label="Delete conversation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </aside>

            {/* ============================================================
                MOBILE DRAWER: Conversation History
                ============================================================ */}
            {isMobileSidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <div
                  className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
                <div className="relative w-80 max-w-full bg-paper border-r border-paper-deep h-full flex flex-col shadow-lift z-10 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-paper-deep mb-3">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-pine" />
                      <h2 className="text-sm font-display font-medium text-pine-deep">Conversations</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1 rounded-lg text-ink-faint hover:text-ink hover:bg-paper-deep/60"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNewSession}
                    className="w-full mb-3 text-xs gap-1.5"
                  >
                    <Plus size={14} />
                    New Conversation
                  </Button>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {sessions.map((sess) => {
                      const isActive = sess.id === activeSessionId
                      return (
                        <div
                          key={sess.id}
                          onClick={() => handleSelectSession(sess.id)}
                          className={`flex items-start justify-between p-3 rounded-xl cursor-pointer border text-left ${
                            isActive
                              ? 'bg-pine-tint border-pine/30'
                              : 'bg-white/80 border-paper-deep/60'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-medium text-ink truncate">{sess.title}</p>
                            <p className="text-[10px] text-ink-faint mt-0.5">
                              {formatSessionDate(sess.updated_at)} • {sess.message_count} messages
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(e, sess.id)}
                            className="p-1 text-ink-faint hover:text-coral"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================
                RIGHT MAIN CHAT WINDOW
                ============================================================ */}
            <div className="lg:col-span-8 flex flex-col bg-white/85 backdrop-blur-sm border border-paper-deep/80 rounded-2xl shadow-card overflow-hidden h-[740px]">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-paper-deep/70 bg-white/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pine-tint flex items-center justify-center text-pine shadow-xs">
                    <MessageCircleHeart size={20} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-medium text-pine-deep text-sm md:text-base">
                        MentalWell Wellness Assistant
                      </p>
                      <span className="hidden sm:inline-flex items-center gap-1 bg-pine-tint text-pine text-[11px] font-medium px-2 py-0.5 rounded-full">
                        <Sparkles size={11} />
                        Gemini AI
                      </span>
                    </div>
                    <p className="text-ink-faint text-xs flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-sage inline-block animate-pulse-soft" />
                      Empathetic companion • Confidential wellness guidance
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewSession}
                  className="text-xs text-ink-soft hover:text-pine !h-8"
                  title="Start a fresh conversation"
                >
                  <Plus size={14} className="mr-1" />
                  New Chat
                </Button>
              </div>

              {/* Error Alert Banner */}
              {errorMessage && (
                <div
                  className={`px-6 py-3 border-b flex items-start gap-3 text-xs ${
                    isConfigError
                      ? 'bg-amber/12 border-amber/30 text-amber-dark'
                      : 'bg-coral/10 border-coral/30 text-coral-dark'
                  }`}
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">{isConfigError ? 'Configuration Notice' : 'Service Notice'}</p>
                    <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="p-1 hover:opacity-70 text-current"
                    aria-label="Dismiss error"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {isLoadingSession ? (
                  <div className="flex flex-col items-center justify-center h-full text-ink-faint text-xs gap-2">
                    <RefreshCw size={20} className="animate-spin text-pine" />
                    <span>Loading conversation history…</span>
                  </div>
                ) : messages.length === 0 ? (
                  /* ============================================================
                     EMPTY STATE / WELCOME CARD & SUGGESTED PROMPTS
                     ============================================================ */
                  <div className="max-w-xl mx-auto py-6 text-center space-y-6">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-pine-tint/90 text-pine flex items-center justify-center shadow-sm">
                      <Bot size={28} strokeWidth={1.5} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-xl md:text-2xl font-medium text-pine-deep">
                        Hi {user?.name?.split(' ')[0] || 'there'}! How are you feeling today?
                      </h3>
                      <p className="text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                        I am your MentalWell wellness companion, powered by Google Gemini AI.
                        I'm here to listen without judgment, reflect on study stress or daily habits,
                        and suggest simple wellness routines.
                      </p>
                    </div>

                    {/* Safety notice pill */}
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pine-tint/60 border border-pine/20 text-[11px] text-pine-deep mx-auto">
                      <ShieldCheck size={13} className="text-pine flex-shrink-0" />
                      <span>Non-diagnostic wellness support • Not a medical or emergency service</span>
                    </div>

                    {/* Suggested prompts cards */}
                    <div className="space-y-2 text-left pt-2">
                      <p className="text-xs font-medium text-ink-faint uppercase tracking-wider text-center">
                        Suggested Starters
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSendMessage(prompt.text)}
                            disabled={isSending}
                            className="p-3.5 rounded-xl bg-white/70 hover:bg-pine-tint/70 border border-paper-deep/80 hover:border-pine/30 transition-all duration-200 text-left group shadow-xs hover:shadow-sm"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">{prompt.emoji}</span>
                              <span className="text-xs font-semibold text-pine-deep group-hover:text-pine">
                                {prompt.title}
                              </span>
                            </div>
                            <p className="text-xs text-ink-soft leading-snug">
                              &ldquo;{prompt.text}&rdquo;
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ============================================================
                     CHAT MESSAGE BUBBLES
                     ============================================================ */
                  messages.map((msg, idx) => {
                    const isUser = msg.role === 'user'
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 ${
                          isUser ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${
                            isUser
                              ? 'bg-pine text-white font-medium'
                              : 'bg-pine-tint text-pine'
                          }`}
                        >
                          {isUser ? (
                            user?.name?.charAt(0).toUpperCase() || <User size={15} />
                          ) : (
                            <Bot size={16} />
                          )}
                        </div>

                        {/* Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${
                            isUser ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs ${
                              isUser
                                ? 'bg-pine text-white rounded-tr-xs'
                                : 'bg-white border border-paper-deep/80 text-ink rounded-tl-xs'
                            }`}
                          >
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <FormattedMessage content={msg.content} />
                            )}
                          </div>

                          {/* Timestamp */}
                          <span className="text-[10px] text-ink-faint mt-1 px-1">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Thinking / Streaming Indicator */}
                {isSending && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-pine-tint text-pine flex items-center justify-center flex-shrink-0 shadow-xs">
                      <Bot size={16} />
                    </div>
                    <div className="px-4 py-3 bg-white border border-paper-deep/80 rounded-2xl rounded-tl-xs shadow-xs text-ink-soft flex items-center gap-2">
                      <div className="flex items-center gap-1.5 py-0.5">
                        <span className="w-2 h-2 rounded-full bg-pine animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-pine animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-pine animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-ink-faint ml-2">MentalWell Companion is thinking…</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ============================================================
                  INPUT BAR
                  ============================================================ */}
              <div className="p-4 border-t border-paper-deep/70 bg-white/70">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="space-y-2"
                >
                  <div className="relative flex items-end gap-2 bg-paper/60 border border-paper-deep/80 rounded-2xl p-2 focus-within:border-pine/60 focus-within:ring-2 focus-within:ring-pine/20 focus-within:bg-white transition-all">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Share what is on your mind or ask for wellness advice… (Press Enter to send)"
                      rows={1}
                      disabled={isSending}
                      maxLength={5000}
                      className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-faint/60 focus:outline-none resize-none max-h-32 min-h-[40px] disabled:opacity-50"
                      aria-label="Chat message input"
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={!inputMessage.trim() || isSending}
                      loading={isSending}
                      className="!h-10 !w-10 !p-0 rounded-xl flex-shrink-0"
                      title="Send message"
                      aria-label="Send message"
                    >
                      <Send size={16} />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between px-2 text-[11px] text-ink-faint">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    <span>{inputMessage.length}/5000</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
