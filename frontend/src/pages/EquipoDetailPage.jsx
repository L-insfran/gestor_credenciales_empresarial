import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api, getApiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { copyToClipboard } from '../utils/clipboard'
import EquipoCredentialForm from '../components/EquipoCredentialForm'
import EquipoCredentialImportModal from '../components/EquipoCredentialImportModal'
import EquipoAccessForm from '../components/EquipoAccessForm'
import EquipoForm from '../components/EquipoForm'

const PWD_MASK = '••••••••'
const CREDENTIALS_PAGE_SIZE = 30
const ACCESS_PAGE_SIZE = 30
const EQUIPOS_FILTERS_STORAGE_KEY = 'gc_equipos_last_search'

function IconArrowLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClipboard({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M6 5h-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />
    </svg>
  )
}

function IconEye({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10.7 5.1A10.3 10.3 0 0 1 12 5c7 0 11 7 11 7a21.2 21.2 0 0 1-3.1 4.1M6.3 6.3 3 3m3.1 3.1L12 12m0 0 4.6 4.6M9.9 9.9a3 3 0 1 0 4.2 4.2" />
    </svg>
  )
}

function IconPencil({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  )
}

function IconTrash({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
    </svg>
  )
}

function getViewerLabelList(c) {
  if (!c.isShared) return []
  if (!c.viewers?.length) return []
  return c.viewers
    .map((v) => (v.user ? `${v.user.nombre} ${v.user.apellido}`.trim() : `#${v.userId}`))
    .filter(Boolean)
}

function TablePagination({ page, pageSize, total, onPageChange, className = '' }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)
  return (
    <div
      className={`flex flex-col gap-2 border-t border-slate-200 bg-slate-50/90 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 dark:border-surface-700 dark:bg-surface-800/50 ${className}`}
    >
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {total === 0
          ? 'Sin registros'
          : `Mostrando ${from}–${to} de ${total}`}
        {total > 0 && (
          <span className="ml-1.5 text-slate-400 dark:text-slate-500">
            · Pág. {safePage} de {totalPages}
          </span>
        )}
      </p>
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-600 dark:bg-surface-900 dark:text-slate-200 dark:enabled:hover:bg-surface-800"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-600 dark:bg-surface-900 dark:text-slate-200 dark:enabled:hover:bg-surface-800"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

function CredentialsTable({ credentials, visiblePwd, onTogglePwd, onCopy, onEdit, onDelete, footer }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-surface-700">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 dark:border-surface-700 dark:bg-surface-800/95 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 sm:px-4">Usuario</th>
              <th className="px-3 py-2 sm:px-4">Clave</th>
              <th className="min-w-[10rem] px-3 py-2 sm:px-4 md:min-w-[12rem]">Enlace / notas</th>
              <th className="w-0 whitespace-nowrap px-3 py-2 text-right sm:px-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-surface-700 dark:bg-surface-900">
            {credentials.map((c) => {
              const visores = getViewerLabelList(c)
              const visibilidadText =
                c.isShared &&
                (visores.length > 0
                  ? `Visible también para: ${visores.join(', ')}`
                  : 'Visible para el dueño del equipo (y administradores)')
              return (
                <tr key={c.id} className="align-top">
                  <td className="px-3 py-1.5 sm:px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.isShared && (
                        <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
                          Compartida
                        </span>
                      )}
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {c.username}
                      </span>
                    </div>
                    {c.isShared && (
                      <p
                        className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400"
                        title={visibilidadText}
                      >
                        {visores.length > 0 ? (
                          <>Visible además: {visores.join(', ')}</>
                        ) : (
                          <>Solo dueño / admins</>
                        )}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-1.5 sm:px-4">
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className="max-w-[9rem] truncate rounded border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-surface-600 dark:bg-surface-800/80 dark:text-slate-200"
                        title={visiblePwd[c.id] ? c.password : undefined}
                      >
                        {visiblePwd[c.id] ? c.password : PWD_MASK}
                      </span>
                      <div className="inline-flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onTogglePwd(c.id)}
                          title={visiblePwd[c.id] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-surface-800 dark:hover:text-slate-200"
                        >
                          {visiblePwd[c.id] ? (
                            <IconEyeOff className="h-4 w-4" />
                          ) : (
                            <IconEye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onCopy(c.password)}
                          title="Copiar al portapapeles"
                          className="rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-surface-800 dark:hover:text-slate-200"
                        >
                          <IconClipboard className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-md px-3 py-1.5 sm:px-4">
                    {c.url || c.notas ? (
                      <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {c.url && (
                          <p className="truncate" title={c.url}>
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              {c.url}
                            </a>
                          </p>
                        )}
                        {c.notas && (
                          <p className="line-clamp-2 text-slate-500 dark:text-slate-400" title={c.notas}>
                            {c.notas}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 sm:px-4">
                    <div className="flex flex-nowrap items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        title="Editar"
                        className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-surface-800 dark:hover:text-indigo-400"
                      >
                        <span className="sr-only">Editar</span>
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        title="Eliminar"
                        className="rounded p-1.5 text-red-500/90 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <span className="sr-only">Eliminar</span>
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {footer}
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
  const location = useLocation()
  const { isSuperadmin, user: authUser } = useAuth()

  const backToEquiposUrl = useMemo(() => {
    const fromState = location.state?.fromEquiposSearch
    if (typeof fromState === 'string') {
      return `/equipos${fromState}`
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = window.sessionStorage.getItem(EQUIPOS_FILTERS_STORAGE_KEY)
        if (typeof stored === 'string') {
          return `/equipos${stored}`
        }
      } catch {
        // ignorar errores de storage
      }
    }
    return '/equipos'
  }, [location.state])

  const goBackToEquipos = useCallback(() => {
    navigate(backToEquiposUrl)
  }, [navigate, backToEquiposUrl])

  const [equipo, setEquipo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)

  const [credentials, setCredentials] = useState([])
  const [accesses, setAccesses] = useState([])
  const [userOptions, setUserOptions] = useState([])

  const [visiblePwd, setVisiblePwd] = useState({})
  const [credForm, setCredForm] = useState({ open: false, initial: null })
  const [accessForm, setAccessForm] = useState({ open: false, formKey: 0 })
  const [equipoForm, setEquipoForm] = useState({ open: false })
  const [importCredOpen, setImportCredOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [accessListSearch, setAccessListSearch] = useState('')
  const [credListSearch, setCredListSearch] = useState('')
  const [detailTab, setDetailTab] = useState('creds')
  const [credPage, setCredPage] = useState(1)
  const [accessPage, setAccessPage] = useState(1)

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
      await copyToClipboard(pwd)
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
      const canEdit = Boolean(eq.equipo?.canEdit)
      const needUserOptions = isSuperadmin || canManageAssignments

      if (canManageAssignments || canEdit) {
        try {
          const { data: acc } = await api.get(`/equipos/${equipoId}/accesos`)
          setAccesses(acc.accesses ?? [])
        } catch {
          setAccesses([])
        }
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

  const accessUserIdSet = useMemo(
    () => new Set(accesses.map((a) => a.userId)),
    [accesses]
  )
  const usersAvailableForGrant = useMemo(
    () => userOptions.filter((u) => !accessUserIdSet.has(u.id)),
    [userOptions, accessUserIdSet]
  )

  const teamMemberUsers = useMemo(
    () => (accesses ?? []).map((a) => a.user).filter(Boolean),
    [accesses]
  )

  const importMemberList = useMemo(() => {
    const list = []
    const seen = new Set()
    if (equipo?.owner) {
      list.push(equipo.owner)
      seen.add(equipo.owner.id)
    }
    for (const u of teamMemberUsers) {
      if (u && !seen.has(u.id)) {
        list.push(u)
        seen.add(u.id)
      }
    }
    return list
  }, [equipo, teamMemberUsers])

  /** Usuarios que ya tienen acceso al equipo (y dueño, con acceso implícito) — para import sin degradar ni duplicar */
  const existingAccessUserIds = useMemo(() => {
    const ids = new Set((accesses ?? []).map((a) => a.userId))
    const oid = equipo?.ownerUserId ?? equipo?.owner?.id
    if (oid) ids.add(oid)
    return Array.from(ids)
  }, [accesses, equipo])

  const canImportAssignToOthers = Boolean(isSuperadmin || equipo?.canEdit)
  const canGrantEquipoAccessOnImport = Boolean(equipo?.canManageAssignments)
  const importEquipoOwnerId = equipo?.ownerUserId ?? equipo?.owner?.id ?? null

  const filteredAccesses = useMemo(() => {
    const q = accessListSearch.trim().toLowerCase()
    if (!q) return accesses
    return accesses.filter((a) => {
      if (!a.user) return String(a.userId).includes(q)
      const name = `${a.user.nombre ?? ''} ${a.user.apellido ?? ''}`.toLowerCase()
      const email = (a.user.email ?? '').toLowerCase()
      return name.includes(q) || email.includes(q) || String(a.user.id).includes(q)
    })
  }, [accesses, accessListSearch])

  const filteredCredentials = useMemo(() => {
    const q = credListSearch.trim().toLowerCase()
    if (!q) return credentials
    return credentials.filter((c) => {
      const username = String(c.username ?? '').toLowerCase()
      const url = String(c.url ?? '').toLowerCase()
      const notas = String(c.notas ?? '').toLowerCase()
      return username.includes(q) || url.includes(q) || notas.includes(q) || String(c.id).includes(q)
    })
  }, [credentials, credListSearch])

  const credListTotal = filteredCredentials.length

  const credTotalPages = useMemo(() => Math.max(1, Math.ceil(credListTotal / CREDENTIALS_PAGE_SIZE)), [credListTotal])

  useEffect(() => {
    if (credPage > credTotalPages) setCredPage(credTotalPages)
  }, [credPage, credTotalPages])

  useEffect(() => {
    setCredPage(1)
  }, [credListSearch])

  const pagedCredentials = useMemo(() => {
    const start = (credPage - 1) * CREDENTIALS_PAGE_SIZE
    return filteredCredentials.slice(start, start + CREDENTIALS_PAGE_SIZE)
  }, [filteredCredentials, credPage])

  const accessListTotal = filteredAccesses.length
  const accessTotalPages = useMemo(
    () => Math.max(1, Math.ceil(accessListTotal / ACCESS_PAGE_SIZE)),
    [accessListTotal]
  )

  useEffect(() => {
    if (accessPage > accessTotalPages) setAccessPage(accessTotalPages)
  }, [accessPage, accessTotalPages])

  useEffect(() => {
    setAccessPage(1)
  }, [accessListSearch])

  const pagedAccessRows = useMemo(() => {
    const start = (accessPage - 1) * ACCESS_PAGE_SIZE
    return filteredAccesses.slice(start, start + ACCESS_PAGE_SIZE)
  }, [filteredAccesses, accessPage])

  const canShowAccessTab = Boolean(equipo?.canManageAssignments)

  const onGrantAccess = async ({ userIds, accessLevel }) => {
    const ids = userIds?.length ? userIds : []
    if (ids.length === 0) return
    setFormLoading(true)
    try {
      const results = await Promise.allSettled(
        ids.map((userId) =>
          api.post(`/equipos/${equipoId}/accesos`, { userId, accessLevel })
        )
      )
      const ok = results.filter((r) => r.status === 'fulfilled').length
      const fail = results.length - ok
      if (ok > 0) {
        if (fail === 0) {
          flash(
            'success',
            ok === 1
              ? 'Acceso otorgado'
              : `Acceso otorgado a ${ok} usuarios con nivel ${accessLevel}.`
          )
        } else {
          flash(
            'success',
            `Acceso otorgado a ${ok} de ${ids.length} usuarios. ${fail} no se pudieron completar.`
          )
        }
        setAccessForm((a) => ({ ...a, open: false }))
        await loadAll()
      }
      if (fail > 0 && ok === 0) {
        const first = results.find((r) => r.status === 'rejected')
        const msg =
          first?.status === 'rejected'
            ? getApiErrorMessage(first.reason)
            : 'Error al otorgar acceso'
        flash('error', msg)
      }
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
      navigate(backToEquiposUrl, { replace: true })
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
        <button type="button" onClick={goBackToEquipos} className="mt-3 text-sm font-semibold text-indigo-600">
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goBackToEquipos}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-surface-600 dark:bg-surface-900 dark:text-slate-200 dark:hover:bg-surface-800"
              title="Volver al listado de equipos"
            >
              <IconArrowLeft className="h-3.5 w-3.5" />
              Volver
            </button>
            <p className="text-xs text-slate-500">
              <Link
                to={backToEquiposUrl}
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Equipos
              </Link>{' '}
              / #{equipoId}
            </p>
          </div>
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
            onClick={() => setImportCredOpen(true)}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-950/60"
          >
            Importar Excel
          </button>
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
              onClick={() => setAccessForm({ open: true, formKey: Date.now() })}
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
        {canShowAccessTab && (
          <div
            className="mb-4 flex flex-col gap-3"
            role="tablist"
            aria-label="Secciones del equipo"
          >
            <div className="inline-flex w-full min-w-0 max-w-2xl rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-surface-700 dark:bg-surface-800/70">
              <button
                type="button"
                role="tab"
                aria-selected={detailTab === 'creds'}
                onClick={() => setDetailTab('creds')}
                className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                  detailTab === 'creds'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-surface-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <span className="hidden sm:inline">Credenciales del equipo</span>
                <span className="sm:hidden">Credenciales</span>
                {!loading && credentials.length > 0 && (
                  <span className="ml-1 font-normal text-slate-400">({credentials.length})</span>
                )}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={detailTab === 'access'}
                onClick={() => setDetailTab('access')}
                className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                  detailTab === 'access'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-surface-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <span className="hidden sm:inline">Usuarios con acceso</span>
                <span className="sm:hidden">Accesos</span>
                {!loading && accesses.length > 0 && (
                  <span className="ml-1 font-normal text-slate-400">({accesses.length})</span>
                )}
              </button>
            </div>
          </div>
        )}

        {(!canShowAccessTab || detailTab === 'creds') && (
          <>
            {!canShowAccessTab && (
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Credenciales del equipo
                {!loading && credentials.length > 0 && (
                  <span className="ml-1.5 font-normal text-slate-400">({credentials.length})</span>
                )}
              </h3>
            )}
            {!loading && credentials.length > 0 && (
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <h3 className="sr-only">Credenciales del equipo</h3>
                <div className="flex w-full min-w-0 flex-col gap-1 sm:ml-auto sm:max-w-md">
                  <label className="sr-only" htmlFor="equipo-credentials-search">
                    Filtrar credenciales del equipo
                  </label>
                  <input
                    id="equipo-credentials-search"
                    type="search"
                    value={credListSearch}
                    onChange={(e) => setCredListSearch(e.target.value)}
                    placeholder="Buscar por usuario, enlace o notas…"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500/30 placeholder:text-slate-400 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                  />
                  {credListSearch.trim() && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Coinciden {filteredCredentials.length} de {credentials.length}
                      <button
                        type="button"
                        onClick={() => setCredListSearch('')}
                        className="ml-2 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Limpiar
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
            {loading ? (
              <p className="text-slate-500">Cargando…</p>
            ) : credentials.length === 0 ? (
              <p className="text-slate-500">Todavía no hay credenciales.</p>
            ) : filteredCredentials.length === 0 ? (
              <p className="text-slate-500">
                Ninguna credencial coincide con “{credListSearch.trim()}”.{' '}
                <button
                  type="button"
                  onClick={() => setCredListSearch('')}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Quitar filtro
                </button>
              </p>
            ) : (
              <CredentialsTable
                credentials={pagedCredentials}
                visiblePwd={visiblePwd}
                onTogglePwd={togglePwd}
                onCopy={copyPwd}
                onEdit={(row) => setCredForm({ open: true, initial: row })}
                onDelete={onDeleteCredential}
                footer={
                  <TablePagination
                    page={credPage}
                    pageSize={CREDENTIALS_PAGE_SIZE}
                    total={credListTotal}
                    onPageChange={setCredPage}
                  />
                }
              />
            )}
          </>
        )}

        {canShowAccessTab && detailTab === 'access' && (
          <div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <h3 className="sr-only">Usuarios con acceso</h3>
              {accesses.length > 0 && (
                <div className="flex w-full min-w-0 flex-col gap-1 sm:ml-auto sm:max-w-md">
                  <label className="sr-only" htmlFor="equipo-access-search">
                    Filtrar usuarios con acceso
                  </label>
                  <input
                    id="equipo-access-search"
                    type="search"
                    value={accessListSearch}
                    onChange={(e) => setAccessListSearch(e.target.value)}
                    placeholder="Buscar por nombre, email o ID…"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500/30 placeholder:text-slate-400 focus:ring-2 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                  />
                  {accessListSearch.trim() && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Coinciden {filteredAccesses.length} de {accesses.length}
                      <button
                        type="button"
                        onClick={() => setAccessListSearch('')}
                        className="ml-2 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Limpiar
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
            {accesses.length === 0 ? (
              <p className="text-slate-500">No hay accesos asignados.</p>
            ) : filteredAccesses.length === 0 ? (
              <p className="text-slate-500">
                Ningún usuario coincide con “{accessListSearch.trim()}”.{' '}
                <button
                  type="button"
                  onClick={() => setAccessListSearch('')}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Quitar filtro
                </button>
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-surface-700">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 dark:border-surface-700 dark:bg-surface-800/95 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2 sm:px-4">Usuario</th>
                        <th className="whitespace-nowrap px-3 py-2 sm:px-4">Nivel</th>
                        <th className="w-0 whitespace-nowrap px-3 py-2 text-right sm:px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-surface-700 dark:bg-surface-900">
                      {pagedAccessRows.map((a) => (
                        <tr key={a.id} className="align-top">
                          <td className="px-3 py-1.5 sm:px-4">
                            {a.user ? (
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 dark:text-slate-100">
                                  {a.user.nombre} {a.user.apellido}
                                  <span className="ml-1.5 text-xs font-normal text-slate-400">#{a.user.id}</span>
                                </p>
                                <p
                                  className="truncate text-xs text-slate-500 dark:text-slate-400"
                                  title={a.user.email}
                                >
                                  {a.user.email}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">ID {a.userId}</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 sm:px-4">
                            <span className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-medium text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                              {a.accessLevel}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right sm:px-4">
                            <button
                              type="button"
                              onClick={() => onRevokeAccess(a)}
                              className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                            >
                              Revocar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  page={accessPage}
                  pageSize={ACCESS_PAGE_SIZE}
                  total={accessListTotal}
                  onPageChange={setAccessPage}
                />
              </div>
            )}
          </div>
        )}
      </section>

      <EquipoCredentialForm
        open={credForm.open}
        loading={formLoading}
        initial={credForm.initial}
        isSuperadmin={isSuperadmin}
        userOptions={userOptions}
        canAssignShared={Boolean(equipo?.canManageAssignments)}
        teamMemberUsers={teamMemberUsers}
        onClose={() => setCredForm({ open: false, initial: null })}
        onSubmit={onSaveCredential}
      />

      <EquipoCredentialImportModal
        open={importCredOpen}
        onClose={() => setImportCredOpen(false)}
        onImported={() => loadAll()}
        flash={flash}
        equipoId={equipoId}
        teamMembers={importMemberList}
        userOptions={userOptions}
        canAssignToOthers={canImportAssignToOthers}
        isSuperadmin={isSuperadmin}
        currentUser={authUser}
        canGrantEquipoAccess={canGrantEquipoAccessOnImport}
        equipoOwnerId={importEquipoOwnerId}
        existingAccessUserIds={existingAccessUserIds}
      />

      <EquipoAccessForm
        key={accessForm.formKey}
        open={accessForm.open}
        loading={formLoading}
        users={usersAvailableForGrant}
        onClose={() => setAccessForm((a) => ({ ...a, open: false }))}
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

