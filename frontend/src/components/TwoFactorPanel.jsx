import { useState } from 'react'
import { api, getApiErrorMessage } from '../services/api'

export default function TwoFactorPanel({ twoFactorEnabled, onChanged }) {
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [setupCode, setSetupCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const flash = (type, text) => {
    setErr(type === 'error' ? text : null)
    setMsg(type === 'success' ? text : null)
    setTimeout(() => {
      setErr(null)
      setMsg(null)
    }, 5000)
  }

  const startEnable = async () => {
    setLoading(true)
    setErr(null)
    try {
      const { data } = await api.post('/2fa/enable')
      setQrDataUrl(data.qrDataUrl)
      setSetupCode('')
      flash('success', 'Escaneá el código QR con tu app authenticator.')
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const confirmEnable = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/2fa/verify', { code: setupCode.trim() })
      setQrDataUrl(null)
      setSetupCode('')
      flash('success', '2FA activado.')
      await onChanged?.()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const cancelSetup = () => {
    setQrDataUrl(null)
    setSetupCode('')
    setErr(null)
  }

  const submitDisable = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = { password: disablePassword }
      if (disableCode.trim()) body.code = disableCode.trim()
      await api.post('/2fa/disable', body)
      setDisablePassword('')
      setDisableCode('')
      flash('success', '2FA desactivado.')
      await onChanged?.()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Autenticación en dos pasos (TOTP)</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Compatible con Microsoft Authenticator, Google Authenticator, etc.
      </p>

      {msg && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </div>
      )}

      {!twoFactorEnabled && !qrDataUrl && (
        <div className="mt-4">
          <button
            type="button"
            disabled={loading}
            onClick={startEnable}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Generando…' : 'Activar 2FA'}
          </button>
        </div>
      )}

      {!twoFactorEnabled && qrDataUrl && (
        <form onSubmit={confirmEnable} className="mt-4 flex flex-col gap-4">
          <div className="flex justify-center rounded-xl border border-slate-100 bg-white p-4 dark:border-surface-600 dark:bg-surface-950">
            <img src={qrDataUrl} alt="Código QR para configurar TOTP" className="max-h-56 w-56" />
          </div>
          <label className="block text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-400">Código de verificación</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              placeholder="6 dígitos"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading || setupCode.length !== 6}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              Confirmar y activar
            </button>
            <button
              type="button"
              onClick={cancelSetup}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-surface-600 dark:text-slate-300 dark:hover:bg-surface-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {twoFactorEnabled && (
        <form onSubmit={submitDisable} className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">El 2FA está activo en tu cuenta.</p>
          <label className="block text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-400">Contraseña actual</span>
            <input
              type="password"
              autoComplete="current-password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-400">Código TOTP (obligatorio para desactivar)</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={loading || disableCode.length !== 6}
            className="w-fit rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
          >
            {loading ? 'Procesando…' : 'Desactivar 2FA'}
          </button>
        </form>
      )}
    </div>
  )
}
