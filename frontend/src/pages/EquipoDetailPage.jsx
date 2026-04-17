import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, getApiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import EquipoCredentialForm from '../components/EquipoCredentialForm'
import EquipoAccessForm from '../components/EquipoAccessForm'
import EquipoForm from '../components/EquipoForm'

function CredentialRow({ c, visiblePwd, onTogglePwd, onCopy, onEdit, onDelete }) {
  const masked = '••••••••'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-900 dark:text-white">
            <span className="font-normal text-slate-500 dark:text-slate-400">user :</span>{' '}
            <span className="font-semibold">{c.username}</span>
          </p>
          {c.url && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">direccion:</span>{' '}
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-500 hover:underline"
              >
                {c.url}
              </a>
            </p>
          )}
          {c.notas && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{c.notas}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-sm dark:bg-surface-800">
            {visiblePwd ? c.password : masked}
          </span>
          <button
            type="button"
            onClick={() => onTogglePwd(c.id)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium dark:border-surface-600"
          >
            {visiblePwd ? 'Ocultar' : 'Mostrar'}
          </button>
          <button
            type="button"
            onClick={() => onCopy(c.password)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium dark:border-surface-600"
          >
            Copiar
          </button>
          <button
            type="button"
            onClick={() => onEdit(c)}
            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-surface-800"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(c)}
            className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

function EquipoDetallesResumen({ detalles }) {
  const d = detalles && typeof detalles === 'object' ? detalles : {}
  const ident = String(d.name ?? '').trim()
  const u = String(d.user ?? '').trim()
  const dir = String(d.direccion ?? '').trim()
  if (!ident && !u && !dir) return null
  return (
    <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm dark:border-surface-700">
      {ident && (
        <p className="text-slate-700 dark:text-slate-200">
          <span className="font-normal text-slate-500 dark:text-slate-400">identificador:</span>{' '}
          <span className="font-medium">{ident}</span>
        </p>
      )}
      {u && (
        <p className="text-slate-700 dark:text-slate-200">
          <span className="font-normal text-slate-500 dark:text-slate-400">user :</span>{' '}
          <span className="font-semibold">{u}</span>
        </p>
      )}
      {dir && (
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <span className="text-slate-500 dark:text-slate-400">direccion:</span>{' '}
          <span className="break-all font-mono text-indigo-600 dark:text-indigo-400">{dir}</span>
        </p>
      )}
    </div>
  )
}

export default function EquipoDetailPage() {
  const { id } = useParams()
  const equipoId = Number(id)
  const navigate = useNavigate()
  const { isSuperadmin } = useAuth()

  const [equipo, setEquipo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)

  const [credentials, setCredentials] = useState([])
  const [accesses, setAccesses] = useState([])
  const [userOptions, setUserOptions] = useState([])

  const [visiblePwd, setVisiblePwd] = useState({})
  const [credForm, setCredForm] = useState({ open: false, initial: null })
  const [accessForm, setAccessForm] = useState({ open: false })
  const [equipoForm, setEquipoForm] = useState({ open: false })
  const [formLoading, setFormLoading] = useState(false)

  const flash = useCallback((type, text) => {
    setErr(type === 'error' ? text : null)
    setMsg(type === 'success' ? text : null)
    setTimeout(() => {
      setErr(null)
      setMsg(null)
    }, 4000)
  }, [])

  const togglePwd = (cid) => setVisiblePwd((v) => ({ ...v, [cid]: !v[cid] }))
  const copyPwd = async (pwd) => {
    try {
      await navigator.clipboard.writeText(pwd)
      flash('success', 'Copiado al portapapeles')
    } catch {
      flash('error', 'No se pudo copiar')
    }
  }

  const loadAll = useCallback(async () => {
    if (!Number.isFinite(equipoId) || equipoId <= 0) return
    setLoading(true)
    try {
      const [{ data: eq }, { data: creds }] = await Promise.all([
        api.get(`/equipos/${equipoId}`),
        api.get(`/equipos/${equipoId}/credenciales`),
      ])
      setEquipo(eq.equipo)
      setCredentials(creds.credentials ?? [])

      const canManageAssignments = Boolean(eq.equipo?.canManageAssignments)
      const needUserOptions = isSuperadmin || canManageAssignments

      if (canManageAssignments) {
        const { data: acc } = await api.get(`/equipos/${equipoId}/accesos`)
        setAccesses(acc.accesses ?? [])
      } else {
        setAccesses([])
      }

      if (needUserOptions) {
        const { data: uo } = await api.get('/users/lookup')
        setUserOptions(uo.users ?? [])
      } else {
        setUserOptions([])
      }
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [equipoId, isSuperadmin, flash])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const onSaveCredential = async (payload, credId) => {
    setFormLoading(true)
    try {
      if (credId) {
        await api.put(`/equipos/${equipoId}/credenciales/${credId}`, payload)
        flash('success', 'Credencial actualizada')
      } else {
        await api.post(`/equipos/${equipoId}/credenciales`, payload)
        flash('success', 'Credencial creada')
      }
      setCredForm({ open: false, initial: null })
      await loadAll()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setFormLoading(false)
    }
  }

  const onDeleteCredential = async (c) => {
    if (!window.confirm('¿Eliminar esta credencial?')) return
    try {
      await api.delete(`/equipos/${equipoId}/credenciales/${c.id}`)
      flash('success', 'Credencial eliminada')
      await loadAll()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    }
  }

  const onGrantAccess = async (payload) => {
    setFormLoading(true)
    try {
      await api.post(`/equipos/${equipoId}/accesos`, payload)
      flash('success', 'Acceso otorgado')
      setAccessForm({ open: false })
      await loadAll()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setFormLoading(false)
    }
  }

  const onRevokeAccess = async (a) => {
    if (!window.confirm('¿Revocar acceso?')) return
    try {
      await api.delete(`/equipos/${equipoId}/accesos/${a.userId}`)
      flash('success', 'Acceso revocado')
      await loadAll()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    }
  }

  const onSaveEquipo = async (payload, id) => {
    setFormLoading(true)
    try {
      const targetId = id ?? equipoId
      await api.put(`/equipos/${targetId}`, payload)
      flash('success', 'Equipo actualizado')
      setEquipoForm({ open: false })
      await loadAll()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setFormLoading(false)
    }
  }

  const onDeleteEquipo = async () => {
    if (!isSuperadmin) return
    const nombre = equipo?.nombre ?? `equipo #${equipoId}`
    if (
      !window.confirm(
        `¿Eliminar el equipo "${nombre}"? Esta acción no se puede deshacer: se borrarán todas las credenciales y accesos asociados.`
      )
    )
      return
    setFormLoading(true)
    try {
      await api.delete(`/equipos/${equipoId}`)
      navigate('/equipos', { replace: true })
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setFormLoading(false)
    }
  }

  if (!Number.isFinite(equipoId) || equipoId <= 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <p className="text-slate-600 dark:text-slate-300">ID de equipo inválido.</p>
        <button type="button" onClick={() => navigate('/equipos')} className="mt-3 text-sm font-semibold text-indigo-600">
          Volver
        </button>
      </div>
    )
  }

  return (
    <>
      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">
            <Link to="/equipos" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Equipos
            </Link>{' '}
            / #{equipoId}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {equipo?.nombre ?? 'Equipo'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tipo: <span className="font-medium">{equipo?.tipo ?? '—'}</span>
          </p>
          <EquipoDetallesResumen detalles={equipo?.detalles} />
        </div>
        <div className="flex flex-wrap gap-2">
          {equipo?.canEdit && (
            <button
              type="button"
              onClick={() => setEquipoForm({ open: true })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-surface-600 dark:bg-surface-900 dark:text-slate-200"
            >
              Editar equipo
            </button>
          )}
          <button
            type="button"
            onClick={() => setCredForm({ open: true, initial: null })}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Nueva credencial
          </button>
          {equipo?.canManageAssignments && (
            <button
              type="button"
              onClick={() => setAccessForm({ open: true })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-surface-600 dark:bg-surface-900 dark:text-slate-200"
            >
              Gestionar accesos
            </button>
          )}
          {isSuperadmin && (
            <button
              type="button"
              onClick={onDeleteEquipo}
              disabled={formLoading || loading}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            >
              Eliminar equipo
            </button>
          )}
        </div>
      </div>

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Credenciales del equipo</h3>
        {loading ? (
          <p className="text-slate-500">Cargando…</p>
        ) : credentials.length === 0 ? (
          <p className="text-slate-500">Todavía no hay credenciales.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {credentials.map((c) => (
              <CredentialRow
                key={c.id}
                c={c}
                visiblePwd={!!visiblePwd[c.id]}
                onTogglePwd={togglePwd}
                onCopy={copyPwd}
                onEdit={(row) => setCredForm({ open: true, initial: row })}
                onDelete={onDeleteCredential}
              />
            ))}
          </div>
        )}
      </section>

      {equipo?.canManageAssignments && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Usuarios con acceso</h3>
          {accesses.length === 0 ? (
            <p className="text-slate-500">No hay accesos asignados.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-surface-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-surface-800/90">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Usuario</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Nivel</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-surface-700 dark:bg-surface-900">
                    {accesses.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                          {a.user ? (
                            <>
                              {a.user.nombre} {a.user.apellido} · {a.user.email}
                              <span className="ml-2 text-xs text-slate-400">#{a.user.id}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">ID {a.userId}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-indigo-700 dark:text-indigo-300">
                          {a.accessLevel}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => onRevokeAccess(a)}
                            className="text-xs font-semibold text-red-600 dark:text-red-400"
                          >
                            Revocar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      <EquipoCredentialForm
        open={credForm.open}
        loading={formLoading}
        initial={credForm.initial}
        isSuperadmin={isSuperadmin}
        userOptions={userOptions}
        onClose={() => setCredForm({ open: false, initial: null })}
        onSubmit={onSaveCredential}
      />

      <EquipoAccessForm
        open={accessForm.open}
        loading={formLoading}
        users={userOptions}
        onClose={() => setAccessForm({ open: false })}
        onSubmit={onGrantAccess}
      />

      <EquipoForm
        open={equipoForm.open}
        initial={
          equipo
            ? {
                id: equipo.id,
                nombre: equipo.nombre,
                tipo: equipo.tipo,
                detalles: equipo.detalles,
                isPrivate: equipo.isPrivate,
              }
            : null
        }
        loading={formLoading}
        isSuperadmin={isSuperadmin}
        title="Editar equipo"
        onClose={() => setEquipoForm({ open: false })}
        onSubmit={(payload, id) => onSaveEquipo(payload, id)}
      />
    </>
  )
}

