import { useMemo, useState } from 'react'

const emptyForm = { accessLevel: 'VIEW' }

function normalizeSearch(s) {
  return s.trim().toLowerCase()
}

export default function EquipoAccessForm({ open, onClose, onSubmit, loading, users = [] }) {
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const q = normalizeSearch(search)
  const filtered = useMemo(() => {
    if (!q) return users
    return users.filter((u) => {
      const name = `${u.nombre ?? ''} ${u.apellido ?? ''}`.toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q) || String(u.id).includes(q)
    })
  }, [users, q])

  const selectedInFiltered = useMemo(
    () => filtered.filter((u) => selectedIds.has(u.id)),
    [filtered, selectedIds]
  )
  const allFilteredSelected =
    filtered.length > 0 && selectedInFiltered.length === filtered.length

  if (!open) return null

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      for (const u of filtered) n.add(u.id)
      return n
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleLevelChange = (e) => {
    setForm((f) => ({ ...f, accessLevel: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedIds.size === 0) return
    onSubmit({
      userIds: Array.from(selectedIds),
      accessLevel: form.accessLevel,
    })
  }

  const n = selectedIds.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Otorgar acceso</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Marca varios usuarios; todos recibirán el mismo nivel. Solo se listan quienes aún no tienen
          acceso a este equipo.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {users.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-300">
              No hay usuarios disponibles: todos los usuarios de la organización ya tienen acceso a
              este equipo.
            </p>
          ) : (
            <>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400">Buscar</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre, email o ID…"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 placeholder:text-slate-400 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                />
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={allFilteredSelected ? clearSelection : selectAllFiltered}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {allFilteredSelected
                    ? 'Quitar marcas (listado actual)'
                    : 'Marcar todos (listado actual)'}
                </button>
                {n > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="font-medium text-slate-600 hover:underline dark:text-slate-400"
                  >
                    Vaciar selección ({n})
                  </button>
                )}
              </div>
              <div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Usuarios</span>
                <div
                  role="group"
                  aria-label="Usuarios para otorgar acceso"
                  className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-surface-600"
                >
                  {filtered.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      Ningún usuario coincide con la búsqueda.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-surface-700">
                      {filtered.map((u) => {
                        const checked = selectedIds.has(u.id)
                        return (
                          <li key={u.id}>
                            <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-surface-800/80">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleId(u.id)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-surface-500"
                              />
                              <span className="min-w-0 text-sm text-slate-800 dark:text-slate-200">
                                <span className="font-medium">
                                  {u.nombre} {u.apellido}
                                </span>
                                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                                  {u.email}
                                </span>
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {n === 0
                    ? 'Ninguno seleccionado'
                    : `${n} seleccionado${n === 1 ? '' : 's'}`}
                </p>
              </div>
            </>
          )}

          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Nivel (para la selección)</span>
            <select
              name="accessLevel"
              value={form.accessLevel}
              onChange={handleLevelChange}
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
              disabled={loading || users.length === 0 || n === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Guardando…' : n > 0 ? `Guardar (${n})` : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

