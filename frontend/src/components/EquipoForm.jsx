import { useEffect, useState } from 'react'

const TIPOS = ['SERVIDOR', 'ACCESS_POINT', 'IMPRESORA', 'OTRO']

const empty = {
  nombre: '',
  tipo: 'OTRO',
  detalleName: '',
  detalleUser: '',
  detalleDireccion: '',
  isPrivate: true,
}

function detallesFromInitial(detalles) {
  const d = detalles && typeof detalles === 'object' ? detalles : {}
  return {
    detalleName: d.name != null ? String(d.name) : '',
    detalleUser: d.user != null ? String(d.user) : '',
    detalleDireccion: d.direccion != null ? String(d.direccion) : '',
  }
}

export default function EquipoForm({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
  isSuperadmin,
  title,
}) {
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!open) return
    if (initial?.id) {
      setForm({
        nombre: initial.nombre ?? '',
        tipo: initial.tipo ?? 'OTRO',
        isPrivate: initial.isPrivate !== false,
        ...detallesFromInitial(initial.detalles),
      })
    } else {
      setForm({ ...empty })
    }
  }, [open, initial])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const base =
      initial?.detalles && typeof initial.detalles === 'object' ? { ...initial.detalles } : {}
    const detalles = { ...base }
    const setOrDelete = (key, val) => {
      const t = String(val).trim()
      if (t) detalles[key] = t
      else delete detalles[key]
    }
    setOrDelete('name', form.detalleName)
    setOrDelete('user', form.detalleUser)
    setOrDelete('direccion', form.detalleDireccion)

    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      detalles,
    }
    if (isSuperadmin) {
      payload.isPrivate = Boolean(form.isPrivate)
    }
    onSubmit(payload, initial?.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title ?? (initial?.id ? 'Editar equipo' : 'Nuevo equipo')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Nombre</span>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Tipo</span>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Datos extra del equipo (opcionales). Se guardan con el equipo y se muestran en su ficha.
          </p>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Identificador o host (opcional)</span>
            <input
              name="detalleName"
              value={form.detalleName}
              onChange={handleChange}
              placeholder="Ej. SYSTELEC"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">user (opcional)</span>
            <input
              name="detalleUser"
              value={form.detalleUser}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">direccion (opcional)</span>
            <input
              name="detalleDireccion"
              value={form.detalleDireccion}
              onChange={handleChange}
              placeholder="IP, UNC o URL"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </label>
          {isSuperadmin && (
            <label className="flex items-center gap-2 text-sm">
              <input name="isPrivate" type="checkbox" checked={form.isPrivate} onChange={handleChange} />
              <span className="text-slate-600 dark:text-slate-400">Equipo privado (solo dueño + SUPERADMIN)</span>
            </label>
          )}
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
