import { useEffect, useState } from 'react'

const empty = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  role: 'USER',
}

export default function UserForm({ open, onClose, onSubmit, loading, initial }) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        nombre: initial.nombre ?? '',
        apellido: initial.apellido ?? '',
        email: initial.email ?? '',
        password: '',
        role: initial.role ?? 'USER',
      })
    } else {
      setForm(empty)
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
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      role: form.role,
    }
    if (form.password.trim()) {
      payload.password = form.password
    }
    onSubmit(payload, initial?.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {initial ? 'Editar usuario' : 'Nuevo usuario'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Nombre</span>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Apellido</span>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Contraseña {initial && '(opcional)'}
            </span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!initial}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Rol</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            >
              <option value="USER">USER</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
