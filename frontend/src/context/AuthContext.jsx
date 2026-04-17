import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  api,
  getApiErrorMessage,
  setTokens,
  clearTokens,
  refreshAccessToken,
  readJwtExpiryMs,
  getAccessToken,
  getRefreshToken,
} from '../services/api'

const AuthContext = createContext(null)

const STORAGE_USER = 'gc_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState(null)

  const logout = useCallback(async () => {
    const refresh_token = getRefreshToken()
    try {
      if (getAccessToken()) {
        await api.post('/logout', refresh_token ? { refresh_token } : {})
      }
    } catch {
      /* sesión ya inválida */
    }
    clearTokens()
    localStorage.removeItem(STORAGE_USER)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setBooting(false)
      return
    }
    try {
      const { data } = await api.get('/me')
      setUser(data.user)
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user))
    } catch {
      try {
        await refreshAccessToken()
        const { data } = await api.get('/me')
        setUser(data.user)
        localStorage.setItem(STORAGE_USER, JSON.stringify(data.user))
      } catch {
        clearTokens()
        localStorage.removeItem(STORAGE_USER)
        setUser(null)
      }
    } finally {
      setBooting(false)
    }
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_USER)
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      } catch {
        localStorage.removeItem(STORAGE_USER)
      }
    }
    refreshUser()
  }, [refreshUser])

  /** Renueva el access token un poco antes de que venza (evita 401 visibles). */
  useEffect(() => {
    if (!user) return undefined
    const tick = () => {
      const exp = readJwtExpiryMs(getAccessToken())
      if (!exp) return
      if (exp - Date.now() < 90_000) {
        refreshAccessToken().catch(() => {})
      }
    }
    const id = setInterval(tick, 30_000)
    tick()
    return () => clearInterval(id)
  }, [user])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const { data } = await api.post('/login', { email, password })
      if (data.requiresTwoFactor && data.pendingToken) {
        return { ok: false, requiresTwoFactor: true, pendingToken: data.pendingToken }
      }
      setTokens(data.access_token, data.refresh_token)
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user))
      setUser(data.user)
      return { ok: true }
    } catch (e) {
      const msg = getApiErrorMessage(e)
      setError(msg)
      return { ok: false, message: msg }
    }
  }, [])

  const completeLoginTotp = useCallback(async (pendingToken, code) => {
    setError(null)
    try {
      const { data } = await api.post('/login/totp', { pendingToken, code })
      setTokens(data.access_token, data.refresh_token)
      localStorage.setItem(STORAGE_USER, JSON.stringify(data.user))
      setUser(data.user)
      return { ok: true }
    } catch (e) {
      const msg = getApiErrorMessage(e)
      setError(msg)
      return { ok: false, message: msg }
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      booting,
      error,
      login,
      completeLoginTotp,
      logout,
      refreshUser,
      isSuperadmin: user?.role === 'SUPERADMIN',
      clearError: () => setError(null),
    }),
    [user, booting, error, login, completeLoginTotp, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Hook de autenticación (exportado junto al provider por conveniencia). */
// eslint-disable-next-line react-refresh/only-export-components -- patrón estándar Context + hook
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
