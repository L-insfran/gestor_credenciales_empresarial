import { useCallback, useEffect, useState } from 'react'

const USER_SORT_COLUMNS = ['nombre', 'email', 'role']
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CredentialForm from '../components/CredentialForm'
import PaginationBar from '../components/PaginationBar'
import UserForm from '../components/UserForm'
import EquipoForm from '../components/EquipoForm'
import TwoFactorPanel from '../components/TwoFactorPanel'
import { api, getApiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'

const SECTIONS = ['usuarios', 'equipos', 'credenciales', 'perfil', 'logs']

const LOG_ACTION_OPTIONS = [
  '',
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'CREATE_CREDENTIAL',
  'UPDATE_CREDENTIAL',
  'DELETE_CREDENTIAL',
  'VIEW_CREDENTIALS',
  'VIEW_EQUIPOS',
  'CREATE_EQUIPO',
  'UPDATE_EQUIPO',
  'DELETE_EQUIPO',
  'GRANT_EQUIPO_ACCESS',
  'REVOKE_EQUIPO_ACCESS',
  'VIEW_EQUIPO_CREDENTIALS',
  'CREATE_EQUIPO_CREDENTIAL',
  'UPDATE_EQUIPO_CREDENTIAL',
  'DELETE_EQUIPO_CREDENTIAL',
]

function EquipoRow({ e, onOpen, onSuperadminDelete }) {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition dark:border-surface-700 dark:bg-surface-900">
      <button
        type="button"
        onClick={() => onOpen(e)}
        className="min-w-0 flex-1 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-surface-800/60"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900 dark:text-white">{e.nombre}</h3>
            <p className="mt-1 text-xs font-mono text-indigo-700 dark:text-indigo-300">{e.tipo}</p>
            {e.isPrivate && (
              <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 dark:bg-surface-800 dark:text-slate-300">
                Privado
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">#{e.id}</span>
        </div>
      </button>
      {onSuperadminDelete && (
        <div className="flex shrink-0 border-l border-slate-200 dark:border-surface-700">
          <button
            type="button"
            onClick={() => onSuperadminDelete(e)}
            className="px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

function CredentialRow({
  c,
  showOwner,
  onEdit,
  onDelete,
  visiblePwd,
  onTogglePwd,
  onCopy,
  onMigrateToEquipo,
}) {
  const masked = '••••••••'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-surface-700 dark:bg-surface-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{c.servicio}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{c.username}</p>
          {showOwner && c.user && (
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
              {c.user.nombre} {c.user.apellido} · {c.user.email}
            </p>
          )}
          {c.url && (
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-indigo-500 hover:underline"
            >
              {c.url}
            </a>
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
          {onMigrateToEquipo && (
            <button
              type="button"
              onClick={() => onMigrateToEquipo(c)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-indigo-700 dark:border-surface-600 dark:text-indigo-300"
            >
              Crear equipo
            </button>
          )}
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

export default function DashboardPage() {
  const { section } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isSuperadmin, user, refreshUser } = useAuth()

  const [logs, setLogs] = useState([])
  const [logsPage, setLogsPage] = useState(1)
  const [logsPerPage, setLogsPerPage] = useState(10)
  const [logsMeta, setLogsMeta] = useState(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilterUserId, setLogFilterUserId] = useState('')
  const [logFilterAction, setLogFilterAction] = useState('')
  const [logDateFrom, setLogDateFrom] = useState('')
  const [logDateTo, setLogDateTo] = useState('')
  const [appliedLogFilters, setAppliedLogFilters] = useState({
    userId: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  })

  const [users, setUsers] = useState([])
  const [userOptions, setUserOptions] = useState([])
  const [usersPage, setUsersPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(10)
  const [usersMeta, setUsersMeta] = useState(null)
  const [userFilterNombre, setUserFilterNombre] = useState('')
  const [userFilterApellido, setUserFilterApellido] = useState('')
  const [debouncedUserNombre, setDebouncedUserNombre] = useState('')
  const [debouncedUserApellido, setDebouncedUserApellido] = useState('')
  const [userSortBy, setUserSortBy] = useState('nombre')
  const [userSortOrder, setUserSortOrder] = useState('asc')

  const [credentials, setCredentials] = useState([])
  const [credPage, setCredPage] = useState(1)
  const [credPerPage, setCredPerPage] = useState(10)
  const [credMeta, setCredMeta] = useState(null)
  const [credFilterServicio, setCredFilterServicio] = useState('')
  const [debouncedCredServicio, setDebouncedCredServicio] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const [visiblePwd, setVisiblePwd] = useState({})
  const [credForm, setCredForm] = useState({ open: false, initial: null })
  const [userForm, setUserForm] = useState({ open: false, initial: null })
  const [equipoForm, setEquipoForm] = useState({ open: false, initial: null })
  const [formLoading, setFormLoading] = useState(false)

  const [equipos, setEquipos] = useState([])
  const [equiposPage, setEquiposPage] = useState(1)
  const [equiposPerPage, setEquiposPerPage] = useState(10)
  const [equiposMeta, setEquiposMeta] = useState(null)
  const [equiposLoading, setEquiposLoading] = useState(false)
  const [equipoFilterNombre, setEquipoFilterNombre] = useState('')
  const [debouncedEquipoNombre, setDebouncedEquipoNombre] = useState('')
  const [equipoFilterTipo, setEquipoFilterTipo] = useState('')

  const [profileForm, setProfileForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
  })
  const [profileSaving, setProfileSaving] = useState(false)

  const flash = useCallback((type, text) => {
    setErr(type === 'error' ? text : null)
    setMsg(type === 'success' ? text : null)
    setTimeout(() => {
      setErr(null)
      setMsg(null)
    }, 4000)
  }, [])

  useEffect(() => {
    if (user) {
      setProfileForm({
        nombre: user.nombre ?? '',
        apellido: user.apellido ?? '',
        email: user.email ?? '',
        password: '',
      })
    }
  }, [user])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserNombre(userFilterNombre.trim()), 350)
    return () => clearTimeout(t)
  }, [userFilterNombre])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserApellido(userFilterApellido.trim()), 350)
    return () => clearTimeout(t)
  }, [userFilterApellido])

  useEffect(() => {
    setUsersPage(1)
  }, [debouncedUserNombre, debouncedUserApellido])

  const loadUsers = useCallback(async () => {
    if (!isSuperadmin) return
    try {
      const sortBy = USER_SORT_COLUMNS.includes(userSortBy) ? userSortBy : 'nombre'
      const sortOrder = userSortOrder === 'desc' ? 'desc' : 'asc'
      const { data } = await api.get('/users', {
        params: {
          page: usersPage,
          perPage: usersPerPage,
          ...(debouncedUserNombre ? { nombre: debouncedUserNombre } : {}),
          ...(debouncedUserApellido ? { apellido: debouncedUserApellido } : {}),
          sortBy,
          sortOrder,
        },
      })
      setUsers(data.users)
      setUsersMeta(data.meta ?? null)
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    }
  }, [
    isSuperadmin,
    flash,
    usersPage,
    usersPerPage,
    debouncedUserNombre,
    debouncedUserApellido,
    userSortBy,
    userSortOrder,
  ])

  const loadUserOptions = useCallback(async () => {
    if (!isSuperadmin) return
    try {
      const { data } = await api.get('/users/lookup')
      setUserOptions(data.users)
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    }
  }, [isSuperadmin, flash])

  const filterUserId = isSuperadmin ? (searchParams.get('userId') ?? '') : ''

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCredServicio(credFilterServicio.trim()), 350)
    return () => clearTimeout(t)
  }, [credFilterServicio])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEquipoNombre(equipoFilterNombre.trim()), 350)
    return () => clearTimeout(t)
  }, [equipoFilterNombre])

  useEffect(() => {
    setEquiposPage(1)
  }, [debouncedEquipoNombre, equipoFilterTipo])

  useEffect(() => {
    setCredPage(1)
  }, [debouncedCredServicio])

  const loadLogs = useCallback(async () => {
    if (!isSuperadmin) return
    setLogsLoading(true)
    try {
      const params = { page: logsPage, perPage: logsPerPage }
      const uid = String(appliedLogFilters.userId).trim()
      if (uid) params.userId = uid
      if (appliedLogFilters.action) params.action = appliedLogFilters.action
      if (appliedLogFilters.dateFrom) params.dateFrom = appliedLogFilters.dateFrom
      if (appliedLogFilters.dateTo) params.dateTo = appliedLogFilters.dateTo
      const { data } = await api.get('/logs', { params })
      setLogs(data.logs ?? [])
      setLogsMeta(data.meta ?? null)
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setLogsLoading(false)
    }
  }, [isSuperadmin, flash, logsPage, logsPerPage, appliedLogFilters])

  const loadCredentials = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: credPage, perPage: credPerPage }
      if (isSuperadmin && filterUserId) {
        params.userId = filterUserId
      }
      if (debouncedCredServicio) {
        params.servicio = debouncedCredServicio
      }
      const { data } = await api.get('/credentials', { params })
      setCredentials(data.credentials)
      setCredMeta(data.meta ?? null)
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [isSuperadmin, filterUserId, flash, credPage, credPerPage, debouncedCredServicio])

  useEffect(() => {
    if (isSuperadmin) loadUserOptions()
  }, [isSuperadmin, loadUserOptions])

  useEffect(() => {
    if (isSuperadmin) loadUsers()
  }, [isSuperadmin, loadUsers])

  useEffect(() => {
    setCredPage(1)
  }, [filterUserId])

  useEffect(() => {
    if (section === 'credenciales') {
      loadCredentials()
    }
  }, [section, loadCredentials])

  useEffect(() => {
    if (section === 'logs') {
      loadLogs()
    }
  }, [section, loadLogs])

  const loadEquipos = useCallback(async () => {
    setEquiposLoading(true)
    try {
      const params = { page: equiposPage, perPage: equiposPerPage }
      if (debouncedEquipoNombre) params.nombre = debouncedEquipoNombre
      if (equipoFilterTipo) params.tipo = equipoFilterTipo
      const { data } = await api.get('/equipos', { params })
      setEquipos(data.equipos ?? [])
      setEquiposMeta(data.meta ?? null)
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setEquiposLoading(false)
    }
  }, [equiposPage, equiposPerPage, debouncedEquipoNombre, equipoFilterTipo, flash])

  useEffect(() => {
    if (section === 'equipos') {
      loadEquipos()
    }
  }, [section, loadEquipos])

  if (!section || !SECTIONS.includes(section)) {
    return <Navigate to="/credenciales" replace />
  }
  if (section === 'usuarios' && !isSuperadmin) {
    return <Navigate to="/credenciales" replace />
  }
  if (section === 'logs' && !isSuperadmin) {
    return <Navigate to="/credenciales" replace />
  }

  const togglePwd = (id) => {
    setVisiblePwd((v) => ({ ...v, [id]: !v[id] }))
  }

  const copyPwd = async (pwd) => {
    try {
      await navigator.clipboard.writeText(pwd)
      flash('success', 'Copiado al portapapeles')
    } catch {
      flash('error', 'No se pudo copiar')
    }
  }

  const onSaveCredential = async (payload, id) => {
    setFormLoading(true)
    try {
      if (id) {
        await api.put(`/credentials/${id}`, payload)
        flash('success', 'Credencial actualizada')
      } else {
        await api.post('/credentials', payload)
        flash('success', 'Credencial creada')
      }
      setCredForm({ open: false, initial: null })
      await loadCredentials()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setFormLoading(false)
    }
  }

  const onDeleteCredential = async (c) => {
    if (!window.confirm(`¿Eliminar credencial "${c.servicio}"?`)) return
    try {
      await api.delete(`/credentials/${c.id}`)
      flash('success', 'Credencial eliminada')
      await loadCredentials()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    }
  }

  const migrateCredentialToEquipo = async (c) => {
    if (!isSuperadmin) return
    const nombre = window.prompt('Nombre del nuevo equipo', c.servicio ?? '')
    if (!nombre) return
    const tipoRaw = window.prompt(
      'Tipo del equipo (SERVIDOR, ACCESS_POINT, IMPRESORA, OTRO)',
      'OTRO'
    )
    if (tipoRaw === null) return
    const tipo = String(tipoRaw).trim().toUpperCase()
    const allowed = ['SERVIDOR', 'ACCESS_POINT', 'IMPRESORA', 'OTRO']
    if (!allowed.includes(tipo)) {
      flash('error', 'Tipo inválido. Usá: SERVIDOR, ACCESS_POINT, IMPRESORA u OTRO.')
      return
    }
    try {
      await api.post('/migrations/credential-to-equipo', {
        credentialId: c.id,
        nombre,
        tipo,
        detalles: {},
      })
      flash('success', 'Equipo creado desde la credencial')
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    }
  }

  const onSaveEquipo = async (payload, id) => {
    setFormLoading(true)
    try {
      if (id) {
        await api.put(`/equipos/${id}`, payload)
        flash('success', 'Equipo actualizado')
      } else {
        await api.post('/equipos', payload)
        flash('success', 'Equipo creado')
      }
      setEquipoForm({ open: false, initial: null })
      await loadEquipos()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setFormLoading(false)
    }
  }

  const onDeleteEquipo = async (e) => {
    if (!isSuperadmin) return
    if (
      !window.confirm(
        `¿Eliminar el equipo "${e.nombre}" (#${e.id})? Esta acción no se puede deshacer: se eliminarán credenciales y accesos del equipo.`
      )
    )
      return
    setFormLoading(true)
    try {
      await api.delete(`/equipos/${e.id}`)
      flash('success', 'Equipo eliminado')
      await loadEquipos()
    } catch (err) {
      flash('error', getApiErrorMessage(err))
    } finally {
      setFormLoading(false)
    }
  }

  const onSaveUser = async (payload, id) => {
    setFormLoading(true)
    try {
      if (id) {
        await api.put(`/users/${id}`, payload)
        flash('success', 'Usuario actualizado')
      } else {
        await api.post('/users', payload)
        flash('success', 'Usuario creado')
      }
      setUserForm({ open: false, initial: null })
      await loadUsers()
      await loadUserOptions()
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setFormLoading(false)
    }
  }

  const onDeleteUser = async (u) => {
    if (!window.confirm(`¿Eliminar usuario ${u.email}?`)) return
    try {
      await api.delete(`/users/${u.id}`)
      flash('success', 'Usuario eliminado')
      await loadUsers()
      await loadUserOptions()
      if (String(filterUserId) === String(u.id)) {
        navigate('/credenciales', { replace: true })
      }
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    }
  }

  const viewUserCredentials = (u) => {
    navigate(`/credenciales?userId=${u.id}`)
  }

  const onProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      const payload = {
        nombre: profileForm.nombre.trim(),
        apellido: profileForm.apellido.trim(),
        email: profileForm.email.trim(),
      }
      if (profileForm.password.trim()) {
        payload.password = profileForm.password
      }
      await api.put('/me', payload)
      setProfileForm((f) => ({ ...f, password: '' }))
      await refreshUser()
      flash('success', 'Perfil actualizado')
    } catch (e) {
      flash('error', getApiErrorMessage(e))
    } finally {
      setProfileSaving(false)
    }
  }

  const onProfileChange = (e) => {
    const { name, value } = e.target
    setProfileForm((f) => ({ ...f, [name]: value }))
  }

  const handleUsersPageChange = (p) => setUsersPage(p)
  const handleUsersPerPageChange = (n) => {
    setUsersPerPage(n)
    setUsersPage(1)
  }

  const handleUserSort = (column) => {
    setUsersPage(1)
    if (userSortBy === column) {
      setUserSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setUserSortBy(column)
      setUserSortOrder('asc')
    }
  }
  const handleCredPageChange = (p) => setCredPage(p)
  const handleCredPerPageChange = (n) => {
    setCredPerPage(n)
    setCredPage(1)
  }

  const handleEquiposPageChange = (p) => setEquiposPage(p)
  const handleEquiposPerPageChange = (n) => {
    setEquiposPerPage(n)
    setEquiposPage(1)
  }

  const handleLogsPageChange = (p) => setLogsPage(p)
  const handleLogsPerPageChange = (n) => {
    setLogsPerPage(n)
    setLogsPage(1)
  }

  const applyLogFilters = () => {
    setAppliedLogFilters({
      userId: logFilterUserId.trim(),
      action: logFilterAction,
      dateFrom: logDateFrom,
      dateTo: logDateTo,
    })
    setLogsPage(1)
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

      {section === 'logs' && isSuperadmin && (
        <section>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Registro de accesos y acciones. Solo lectura para SUPERADMIN.
          </p>
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-surface-700 dark:bg-surface-800/50">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block min-w-[6rem] text-sm">
                <span className="mb-1 block font-medium text-slate-600 dark:text-slate-400">Usuario ID</span>
                <input
                  type="number"
                  min={1}
                  value={logFilterUserId}
                  onChange={(e) => setLogFilterUserId(e.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                />
              </label>
              <label className="block min-w-[10rem] text-sm">
                <span className="mb-1 block font-medium text-slate-600 dark:text-slate-400">Acción</span>
                <select
                  value={logFilterAction}
                  onChange={(e) => setLogFilterAction(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                >
                  <option value="">Todas</option>
                  {LOG_ACTION_OPTIONS.filter(Boolean).map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-[9rem] text-sm">
                <span className="mb-1 block font-medium text-slate-600 dark:text-slate-400">Desde</span>
                <input
                  type="date"
                  value={logDateFrom}
                  onChange={(e) => setLogDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                />
              </label>
              <label className="block min-w-[9rem] text-sm">
                <span className="mb-1 block font-medium text-slate-600 dark:text-slate-400">Hasta</span>
                <input
                  type="date"
                  value={logDateTo}
                  onChange={(e) => setLogDateTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                />
              </label>
              <button
                type="button"
                onClick={applyLogFilters}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Aplicar filtros
              </button>
            </div>
          </div>

          {logsLoading ? (
            <p className="text-slate-500">Cargando registros…</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-surface-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-surface-800/90">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Fecha</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Acción</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Usuario</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">IP</th>
                      <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white dark:divide-surface-700 dark:bg-surface-900">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          Sin registros en esta página.
                        </td>
                      </tr>
                    ) : (
                      logs.map((row) => (
                        <tr key={row.id}>
                          <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-300">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-indigo-700 dark:text-indigo-300">
                            {row.action}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                            {row.user ? (
                              <>
                                {row.user.email}
                                <span className="ml-1 text-xs text-slate-400">#{row.user.id}</span>
                              </>
                            ) : row.userId ? (
                              <span className="text-slate-400">ID {row.userId}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.ipAddress ?? '—'}</td>
                          <td className="max-w-xs truncate px-4 py-2.5 text-xs text-slate-500" title={JSON.stringify(row.metadata ?? {})}>
                            {row.metadata ? JSON.stringify(row.metadata) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                meta={logsMeta}
                perPage={logsPerPage}
                onPageChange={handleLogsPageChange}
                onPerPageChange={handleLogsPerPageChange}
              />
            </div>
          )}
        </section>
      )}

      {section === 'usuarios' && isSuperadmin && (
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Alta, edición y eliminación de cuentas del sistema.
            </p>
            <button
              type="button"
              onClick={() => setUserForm({ open: true, initial: null })}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Nuevo usuario
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-surface-700">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-surface-700 dark:bg-surface-800/50 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="block min-w-[10rem] flex-1 text-sm">
                <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-400">Buscar por nombre</span>
                <input
                  type="search"
                  value={userFilterNombre}
                  onChange={(e) => setUserFilterNombre(e.target.value)}
                  placeholder="Ej. Juan"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                />
              </label>
              <label className="block min-w-[10rem] flex-1 text-sm">
                <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-400">Buscar por apellido</span>
                <input
                  type="search"
                  value={userFilterApellido}
                  onChange={(e) => setUserFilterApellido(e.target.value)}
                  placeholder="Ej. Pérez"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-surface-800/90">
                  <tr>
                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleUserSort('nombre')}
                        className="inline-flex items-center gap-1.5 rounded-lg text-left font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        title={userSortBy === 'nombre' ? (userSortOrder === 'asc' ? 'Orden: A → Z' : 'Orden: Z → A') : 'Ordenar por nombre'}
                      >
                        Nombre
                        <span className="inline-flex flex-col leading-[0.55] text-[9px]" aria-hidden>
                          <span
                            className={
                              userSortBy === 'nombre' && userSortOrder === 'asc'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          >
                            ▲
                          </span>
                          <span
                            className={
                              userSortBy === 'nombre' && userSortOrder === 'desc'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          >
                            ▼
                          </span>
                        </span>
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleUserSort('email')}
                        className="inline-flex items-center gap-1.5 rounded-lg text-left font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        title={userSortBy === 'email' ? (userSortOrder === 'asc' ? 'Orden: A → Z' : 'Orden: Z → A') : 'Ordenar por email'}
                      >
                        Email
                        <span className="inline-flex flex-col leading-[0.55] text-[9px]" aria-hidden>
                          <span
                            className={
                              userSortBy === 'email' && userSortOrder === 'asc'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          >
                            ▲
                          </span>
                          <span
                            className={
                              userSortBy === 'email' && userSortOrder === 'desc'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          >
                            ▼
                          </span>
                        </span>
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleUserSort('role')}
                        className="inline-flex items-center gap-1.5 rounded-lg text-left font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        title={userSortBy === 'role' ? (userSortOrder === 'asc' ? 'Orden: A → Z' : 'Orden: Z → A') : 'Ordenar por rol'}
                      >
                        Rol
                        <span className="inline-flex flex-col leading-[0.55] text-[9px]" aria-hidden>
                          <span
                            className={
                              userSortBy === 'role' && userSortOrder === 'asc'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          >
                            ▲
                          </span>
                          <span
                            className={
                              userSortBy === 'role' && userSortOrder === 'desc'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          >
                            ▼
                          </span>
                        </span>
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-surface-700 dark:bg-surface-900">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                        No hay usuarios en esta página.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-5 py-3.5 text-slate-900 dark:text-white">
                          {u.nombre} {u.apellido}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                              u.role === 'SUPERADMIN'
                                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-surface-800 dark:text-slate-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => viewUserCredentials(u)}
                              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                              Ver credenciales
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserForm({ open: true, initial: u })}
                              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteUser(u)}
                              className="text-xs font-semibold text-red-600 dark:text-red-400"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationBar
              meta={usersMeta}
              perPage={usersPerPage}
              onPageChange={handleUsersPageChange}
              onPerPageChange={handleUsersPerPageChange}
            />
          </div>
        </section>
      )}

      {section === 'credenciales' && (
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isSuperadmin ? 'Credenciales de todos los usuarios o filtradas por cuenta.' : 'Tus credenciales almacenadas de forma cifrada.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={credFilterServicio}
                onChange={(e) => setCredFilterServicio(e.target.value)}
                placeholder="Buscar por servicio…"
                autoComplete="off"
                aria-label="Filtrar por nombre del servicio"
                className="min-w-[12rem] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white sm:max-w-xs sm:flex-none"
              />
              {isSuperadmin && (
                <select
                  value={filterUserId}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v) navigate(`/credenciales?userId=${v}`, { replace: true })
                    else navigate('/credenciales', { replace: true })
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                >
                  <option value="">Todos los usuarios</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() =>
                  setCredForm({
                    open: true,
                    initial: filterUserId ? { userId: filterUserId } : null,
                  })
                }
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Agregar
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-500">Cargando credenciales…</p>
          ) : credentials.length === 0 ? (
            <p className="text-slate-500">No hay credenciales para mostrar.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {credentials.map((c) => (
                <CredentialRow
                  key={c.id}
                  c={c}
                  showOwner={isSuperadmin}
                  visiblePwd={!!visiblePwd[c.id]}
                  onTogglePwd={togglePwd}
                  onCopy={copyPwd}
                  onEdit={(row) => setCredForm({ open: true, initial: row })}
                  onDelete={onDeleteCredential}
                  onMigrateToEquipo={isSuperadmin ? migrateCredentialToEquipo : null}
                />
              ))}
            </div>
          )}
          {!loading && (
            <PaginationBar
              meta={credMeta}
              perPage={credPerPage}
              onPageChange={handleCredPageChange}
              onPerPageChange={handleCredPerPageChange}
            />
          )}
        </section>
      )}

      {section === 'equipos' && (
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Equipos visibles para tu usuario. Entrá a un equipo para ver y gestionar sus credenciales.
            </p>
            <button
              type="button"
              onClick={() => setEquipoForm({ open: true, initial: null })}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Nuevo equipo
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-surface-700 dark:bg-surface-800/50 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block min-w-[12rem] flex-1 text-sm">
              <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-400">Buscar por nombre</span>
              <input
                type="search"
                value={equipoFilterNombre}
                onChange={(e) => setEquipoFilterNombre(e.target.value)}
                placeholder="Ej. Servidor CRM"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
              />
            </label>
            <label className="block min-w-[12rem] text-sm">
              <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-400">Tipo</span>
              <select
                value={equipoFilterTipo}
                onChange={(e) => setEquipoFilterTipo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-surface-600 dark:bg-surface-900 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="SERVIDOR">SERVIDOR</option>
                <option value="ACCESS_POINT">ACCESS_POINT</option>
                <option value="IMPRESORA">IMPRESORA</option>
                <option value="OTRO">OTRO</option>
              </select>
            </label>
          </div>

          {equiposLoading ? (
            <p className="text-slate-500">Cargando equipos…</p>
          ) : equipos.length === 0 ? (
            <p className="text-slate-500">No hay equipos para mostrar.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {equipos.map((e) => (
                <EquipoRow
                  key={e.id}
                  e={e}
                  onOpen={(row) => navigate(`/equipos/${row.id}`)}
                  onSuperadminDelete={isSuperadmin ? onDeleteEquipo : null}
                />
              ))}
            </div>
          )}

          {!equiposLoading && (
            <PaginationBar
              meta={equiposMeta}
              perPage={equiposPerPage}
              onPageChange={handleEquiposPageChange}
              onPerPageChange={handleEquiposPerPageChange}
            />
          )}
        </section>
      )}

      {section === 'perfil' && (
        <section>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Actualizá tu nombre, email o contraseña. La contraseña solo se cambia si completás el campo.
          </p>
          <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-900">
            <form onSubmit={onProfileSubmit} className="flex flex-col gap-4">
              <label className="block text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-400">Nombre</span>
                <input
                  name="nombre"
                  value={profileForm.nombre}
                  onChange={onProfileChange}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-400">Apellido</span>
                <input
                  name="apellido"
                  value={profileForm.apellido}
                  onChange={onProfileChange}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-400">Email</span>
                <input
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={onProfileChange}
                  required
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-400">Nueva contraseña (opcional)</span>
                <input
                  name="password"
                  type="password"
                  value={profileForm.password}
                  onChange={onProfileChange}
                  autoComplete="new-password"
                  minLength={profileForm.password.trim() ? 8 : undefined}
                  placeholder="Mínimo 8 caracteres"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-2 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                />
              </label>
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {profileSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
          <TwoFactorPanel twoFactorEnabled={!!user?.twoFactorEnabled} onChanged={refreshUser} />
        </section>
      )}

      <CredentialForm
        open={credForm.open}
        initial={credForm.initial}
        loading={formLoading}
        showUserSelect={isSuperadmin}
        users={userOptions}
        onClose={() => setCredForm({ open: false, initial: null })}
        onSubmit={onSaveCredential}
      />

      <UserForm
        open={userForm.open}
        initial={userForm.initial}
        loading={formLoading}
        onClose={() => setUserForm({ open: false, initial: null })}
        onSubmit={onSaveUser}
      />

      <EquipoForm
        open={equipoForm.open}
        initial={equipoForm.initial}
        loading={formLoading}
        isSuperadmin={isSuperadmin}
        onClose={() => setEquipoForm({ open: false, initial: null })}
        onSubmit={onSaveEquipo}
      />
    </>
  )
}
