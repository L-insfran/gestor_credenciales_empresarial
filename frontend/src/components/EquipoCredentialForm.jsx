import { useEffect, useState } from 'react'

const empty = {
  username: '',
  password: '',
  url: '',
  notas: '',
  targetUserId: '',
}

export default function EquipoCredentialForm({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
  isSuperadmin,
  userOptions = [],
}) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!open) return
    if (initial?.id) {
      setForm({
        username: initial.username ?? '',
        password: initial.password ?? '',
        url: initial.url ?? '',
        notas: initial.notas ?? '',
        targetUserId: initial.targetUserId ? String(initial.targetUserId) : '',
      })
    } else {
      setForm({ ...empty })
    }
  }, [open, initial])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      username: form.username.trim(),
      url: form.url.trim() || null,
      notas: form.notas.trim() || null,
    }
    if (form.password.trim() || !initial?.id) {
      payload.password = form.password
    }
    if (isSuperadmin) {
      if (form.targetUserId) payload.targetUserId = Number(form.targetUserId)
    }
    onSubmit(payload, initial?.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {initial?.id ? 'Editar credencial del equipo' : 'Nueva credencial del equipo'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {isSuperadmin && (
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400">Usuario destino (opcional)</span>
              <select
                name="targetUserId"
                value={form.targetUserId}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              >
                <option value="">Mi credencial / default</option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} ({u.email})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Usuario / login</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Contraseña {initial?.id && '(dejar igual si no cambia)'}
            </span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!initial?.id}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">URL (opcional)</span>
            <input
              name="url"
              value={form.url}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Notas (opcional)</span>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-surface-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

