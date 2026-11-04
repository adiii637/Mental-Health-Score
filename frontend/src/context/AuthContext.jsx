import { createContext, useState, useEffect, useCallback } from 'react'
import { registerUser, loginUser, getCurrentUser } from '../api/auth'
import { TOKEN_STORAGE_KEY } from '../api/client'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verify and restore user session on initial load or when token changes
  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        const profile = await getCurrentUser()
        if (isMounted) {
          setUser(profile)
          setToken(storedToken)
          setError(null)
        }
      } catch (err) {
        // Token expired or invalid
        if (isMounted) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setUser(null)
          setToken(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    const result = await loginUser({ email, password })
    localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token)
    setToken(result.access_token)
    setUser(result.user)
    return result.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    setError(null)
    // 1. Register account
    await registerUser({ name, email, password })
    // 2. Automatically log in to establish session
    const loginResult = await loginUser({ email, password })
    localStorage.setItem(TOKEN_STORAGE_KEY, loginResult.access_token)
    setToken(loginResult.access_token)
    setUser(loginResult.user)
    return loginResult.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
    setToken(null)
    setError(null)
  }, [])

  const updateUserState = useCallback((updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData))
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    updateUserState,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
