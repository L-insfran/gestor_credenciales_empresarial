import { useEffect, useMemo, useState } from 'react'

const getEmpty = () => ({
  mode: 'personal',
  username: '',
  password: '',
  url: '',
  notas: '',
  targetUserId: '',
  viewerIds: new Set(),
})

function normalizeSearch(s) {
  return s.trim().toLowerCase()
}

export default function EquipoCredentialForm({
  open,
  onClose,
  onSubmit,
  loading,
  initial,
  isSuperadmin,
  userOptions = [],
  canAssignShared = false,
  teamMemberUsers = [],
}) {
  const [form, setForm] = useState(() => getEmpty())
  const [search, setSearch] = useState('')

  const q = normalizeSearch(search)
  const filteredTeam = useMemo(() => {
    if (!q) return teamMemberUsers
    return teamMemberUsers.filter((u) => {
      const name = `${u.nombre ?? ''} ${u.apellido ?? ''}`.toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q) || String(u.id).includes(q)
    })
  }, [teamMemberUsers, q])

  useEffect(() => {
    if (!open) return
    if (initial?.id) {
      const shared = Boolean(initial.isShared)
      const ids = new Set(
        (initial.viewers ?? []).map((v) => v.userId).filter((id) => id != null)
      )
      setForm({
        mode: shared ? 'shared' : 'personal',
        username: initial.username ?? '',
        password: initial.password ?? '',
        url: initial.url ?? '',
        notas: initial.notas ?? '',
        targetUserId: initial.targetUserId ? String(initial.targetUserId) : '',
        viewerIds: ids,
      })
    } else {
      setForm(getEmpty())
    }
    setSearch('')
  }, [open, initial])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const setMode = (mode) => {
    setForm((f) => ({ ...f, mode, viewerIds: mode === 'shared' ? f.viewerIds : new Set() }))
  }

  const toggleViewer = (id) => {
    setForm((f) => {
      const n = new Set(f.viewerIds)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return { ...f, viewerIds: n }
    })
  }

  const selectAllFiltered = () => {
    setForm((f) => {
      const n = new Set(f.viewerIds)
      for (const u of filteredTeam) n.add(u.id)
      return { ...f, viewerIds: n }
    })
  }

  const clearViewers = () => setForm((f) => ({ ...f, viewerIds: new Set() }))

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
    if (!initial?.id && form.mode === 'shared' && canAssignShared) {
      payload.isShared = true
      payload.viewerUserIds = Array.from(form.viewerIds)
    } else if (initial?.id && form.mode === 'shared' && canAssignShared && !initial.isShared) {
      // Al editar: convertir personal → compartida (el backend requiere isShared + viewerUserIds)
      payload.isShared = true
      payload.viewerUserIds = Array.from(form.viewerIds)
    } else if (initial?.isShared && canAssignShared) {
      payload.viewerUserIds = Array.from(form.viewerIds)
    } else {
      if (isSuperadmin && !initial?.isShared && form.mode !== 'shared') {
        if (form.targetUserId) payload.targetUserId = Number(form.targetUserId)
      }
    }
    onSubmit(payload, initial?.id)
  }

  const shared = form.mode === 'shared' && canAssignShared
  const nViewers = form.viewerIds.size

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {initial?.id ? 'Editar credencial del equipo' : 'Nueva credencial del equipo'}
        </h2>

        {canAssignShared && !initial?.isShared && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Usa <span className="font-medium">compartida</span> para una sola clave (por ejemplo, acceso
            al equipo) y elige qué miembros del equipo pueden verla. El dueño del equipo la ve siempre.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {canAssignShared && (
            <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-surface-600">
              <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={form.mode === 'personal'}
                  onChange={() => setMode('personal')}
                />
                <span>Personal (solo asignada a un usuario en el dominio de credenciales)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={form.mode === 'shared'}
                  onChange={() => setMode('shared')}
                />
                <span>Compartida (misma clave, visibilidad por miembro)</span>
              </label>
            </fieldset>
          )}

          {initial?.isShared && canAssignShared && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Credencial compartida. Marca a los miembros con acceso al equipo que deben ver esta
              clave. El dueño del equipo no hace falta en la lista.
            </p>
          )}
        {initial?.isShared && !canAssignShared && (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-300">
            {initial.viewers?.length ? (
              <>
                Pueden verla además del dueño:{' '}
                {initial.viewers
                  .map((v) =>
                    v.user ? `${v.user.nombre} ${v.user.apellido}`.trim() : `usuario #${v.userId}`
                  )
                  .join(', ')}
              </>
            ) : (
              'Solo el dueño del equipo (y administradores) puede ver esta clave. Para asignar a más'
              + ' miembros, pídele al dueño o a un administrador que ajuste la visibilidad.'
            )}
          </p>
        )}

          {isSuperadmin && !shared && !initial?.isShared && (
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400">Usuario destino (opcional)</span>
              <select
                name="targetUserId"
                value={form.targetUserId}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              >
                <option value="">Por defecto (tú o quien se indique arriba)</option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido} ({u.email})
                  </option>
                ))}
              </select>
            </label>
          )}

          {shared && (
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                ¿Quién puede ver esta credencial?
              </span>
              <p className="mb-1 text-xs text-slate-500">
                Solo usuarios con acceso a este equipo. Puedes dejarlo vacío para que solo el dueño
                del equipo (y administradores) la vean.
              </p>
              {teamMemberUsers.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-surface-600 dark:bg-surface-800">
                  Carga primero los accesos al equipo, o añade usuarios con “Gestionar accesos”.
                </p>
              ) : (
                <>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar en la lista…"
                    className="mb-1 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-indigo-500/30 placeholder:text-slate-400 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                  />
                  <div className="mb-1 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Marcar visibles (listado)
                    </button>
                    {nViewers > 0 && (
                      <button
                        type="button"
                        onClick={clearViewers}
                        className="font-medium text-slate-600 hover:underline"
                      >
                        Vaciar ({nViewers})
                      </button>
                    )}
                  </div>
                  <div
                    role="group"
                    className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-surface-600"
                  >
                    <ul className="divide-y divide-slate-100 dark:divide-surface-700">
                      {filteredTeam.map((u) => {
                        const checked = form.viewerIds.has(u.id)
                        return (
                          <li key={u.id}>
                            <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-surface-800/80">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleViewer(u.id)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="min-w-0 text-sm text-slate-800 dark:text-slate-200">
                                <span className="font-medium">
                                  {u.nombre} {u.apellido}
                                </span>
                                <span className="block truncate text-xs text-slate-500">
                                  {u.email}
                                </span>
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </>
              )}
            </div>
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
