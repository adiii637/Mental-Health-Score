import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2, Leaf } from 'lucide-react'

/**
 * ProtectedRoute component: Ensures only authenticated users can access the route.
 * Redirects unauthenticated visitors to /login, saving their intended destination.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper text-ink p-4">
        <div className="w-12 h-12 rounded-2xl bg-pine/10 text-pine flex items-center justify-center mb-4 animate-pulse">
          <Leaf className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-ink-soft text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-pine" />
          <span>Verifying session…</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
