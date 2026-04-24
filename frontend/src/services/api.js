import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? ''

export const ACCESS_TOKEN_KEY = 'gc_access_token'
export const REFRESH_TOKEN_KEY = 'gc_refresh_token'
/** @deprecated migración desde token único */
const LEGACY_TOKEN_KEY = 'token'

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const rawClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

let refreshPromise = null

export async function refreshAccessToken() {
  const rt = getRefreshToken()
  if (!rt) {
    throw new Error('Sin refresh token')
  }
  if (!refreshPromise) {
    refreshPromise = rawClient
      .post('/refresh-token', { refresh_token: rt })
      .then(({ data }) => {
        setTokens(data.access_token, data.refresh_token)
        return data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const url = String(original?.url ?? '')
    if (
      status !== 401 ||
      original?._retry ||
      url.includes('/refresh-token') ||
      url.includes('/login')
    ) {
      return Promise.reject(error)
    }
    try {
      await refreshAccessToken()
      original._retry = true
      original.headers.Authorization = `Bearer ${getAccessToken()}`
      return api(original)
    } catch {
      clearTokens()
      return Promise.reject(error)
    }
  }
)

/** `exp` del JWT en ms (epoch), o null si no se puede leer. */
export function readJwtExpiryMs(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') return null
  try {
    const part = accessToken.split('.')[1]
    if (!part) return null
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    b64 += '='.repeat((4 - (b64.length % 4)) % 4)
    const json = JSON.parse(atob(b64))
    if (typeof json.exp !== 'number') return null
    return json.exp * 1000
  } catch {
    return null
  }
}

/**
 * Alineado con 422 de Adonis/Vine: { message, errors: [...] }.
 * No usar solo `message` ("Error de validación") si hay detalle en `errors`.
 */
function formatApiValidationErrors(data) {
  const raw = data?.errors
  if (raw == null) return null
  if (Array.isArray(raw) && raw.length) {
    const parts = raw.map((e) => {
      if (typeof e === 'string') return e
      if (e && typeof e === 'object' && e.message) {
        const f = e.field
        return f && typeof f === 'string' ? `${f}: ${e.message}` : e.message
      }
      return null
    })
    const joined = parts.filter(Boolean).join(' · ')
    return joined || null
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.entries(raw)
      .map(([k, v]) => {
        if (Array.isArray(v)) return `${k}: ${v.join(', ')}`
        return `${k}: ${v}`
      })
      .join(' · ')
  }
  return null
}

export function getApiErrorMessage(err) {
  const d = err.response?.data
  if (!d) return err.message || 'Error de red'
  const fromValidation = formatApiValidationErrors(d)
  if (fromValidation) return fromValidation
  if (typeof d.message === 'string') return d.message
  if (d.errors) return 'Revisa los datos del formulario'
  return 'Error en la solicitud'
}
