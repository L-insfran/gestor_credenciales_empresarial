import { useEffect, useState } from 'react'

const empty = {
  userId: '',
  accessLevel: 'VIEW',
}

export default function EquipoAccessForm({ open, onClose, onSubmit, loading, users = [] }) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!open) return
    setForm({ ...empty })
  }, [open])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.userId) return
    onSubmit({ userId: Number(form.userId), accessLevel: form.accessLevel })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Otorgar acceso</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Usuario</span>
            <select
              name="userId"
              value={form.userId}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            >
              <option value="">Seleccionar…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido} ({u.email})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Nivel</span>
            <select
              name="accessLevel"
              value={form.accessLevel}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            >
              <option value="VIEW">VIEW (solo lectura)</option>
              <option value="EDIT">EDIT (gestión)</option>
            </select>
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

