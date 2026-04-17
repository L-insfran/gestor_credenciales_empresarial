import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, completeLoginTotp, user, booting, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [pendingToken, setPendingToken] = useState(null)
  const [loading, setLoading] = useState(false)

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-surface-950">
        <p className="text-slate-500">Cargando…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmitCredentials = async (e) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    const r = await login(email, password)
    setLoading(false)
    if (r.requiresTwoFactor && r.pendingToken) {
      setPendingToken(r.pendingToken)
      setTotpCode('')
    }
  }

  const onSubmitTotp = async (e) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    await completeLoginTotp(pendingToken, totpCode.trim())
    setLoading(false)
  }

  const backToCredentials = () => {
    setPendingToken(null)
    setTotpCode('')
    clearError()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-indigo-50 px-4 dark:from-surface-950 dark:via-surface-900 dark:to-indigo-950/40">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-surface-700 dark:bg-surface-900/90">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">MVP seguro</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {pendingToken ? 'Verificación en dos pasos' : 'Iniciar sesión'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {pendingToken
              ? 'Ingresá el código de Microsoft Authenticator u otra app TOTP.'
              : 'Gestor interno de credenciales'}
          </p>
        </div>

        {!pendingToken ? (
          <form onSubmit={onSubmitCredentials} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}
            <label className="block text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Email</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmitTotp} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            )}
            <label className="block text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Código de 6 dígitos</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="000000"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-lg tracking-widest text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              />
            </label>
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="mt-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? 'Verificando…' : 'Confirmar e ingresar'}
            </button>
            <button
              type="button"
              onClick={backToCredentials}
              className="text-center text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
