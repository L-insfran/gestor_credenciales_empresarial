import { useCallback, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SIDEBAR_STORAGE_KEY = 'gc_sidebar_collapsed'

function IconUsers({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconKey({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconUserCircle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 6.5-5 8-5s6.5 1 8 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconSun({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  )
}

function IconMoon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconScroll({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPanelLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 3v18" strokeLinecap="round" />
    </svg>
  )
}

function IconServer({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="6" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="14" width="18" height="6" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7h.01M7 17h.01" strokeLinecap="round" />
    </svg>
  )
}

export default function DashboardLayout() {
  const { user, logout, isSuperadmin } = useAuth()
  const location = useLocation()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  )

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    const nextDark = !root.classList.contains('dark')
    if (nextDark) {
      root.classList.add('dark')
      localStorage.setItem('gc_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('gc_theme', 'light')
    }
    setIsDark(nextDark)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  const pageTitle = (() => {
    const s = location.pathname.split('/').filter(Boolean)[0]
    if (s === 'equipos') return 'Equipos'
    if (s === 'usuarios') return 'Usuarios'
    if (s === 'perfil') return 'Mi perfil'
    if (s === 'logs') return 'Auditoría'
    return 'Credenciales'
  })()

  const linkActive =
    'border-indigo-500/40 bg-indigo-600 text-white shadow-md shadow-indigo-900/20 dark:shadow-indigo-950/40'
  const linkIdle =
    'text-slate-600 hover:border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-surface-600 dark:hover:bg-surface-800/80'

  const navBase =
    'flex items-center rounded-xl border border-transparent text-sm font-medium transition-all duration-200'
  const navExpanded = 'gap-3 px-3 py-2.5'
  const navCollapsed = 'justify-center px-0 py-2.5'

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-surface-950 dark:text-slate-200">
      <aside
        className={`relative flex shrink-0 flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur transition-[width] duration-200 ease-out dark:border-surface-800 dark:bg-surface-900/95 ${
          sidebarCollapsed ? 'w-[4.25rem]' : 'w-64'
        }`}
      >
        <div
          className={`flex border-b border-slate-200/80 dark:border-surface-800 ${
            sidebarCollapsed ? 'flex-col items-center gap-3 px-2 py-4' : 'items-start justify-between gap-2 px-4 py-5'
          }`}
        >
          {sidebarCollapsed ? (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold tracking-tight text-white shadow-sm"
              title="Credenciales empresariales"
            >
              CE
            </span>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                Credenciales empresariales
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Panel</p>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-300 dark:hover:bg-surface-700"
          >
            <IconPanelLeft
              className={`h-5 w-5 transition-transform duration-200 ${sidebarCollapsed ? 'scale-x-[-1]' : ''}`}
            />
          </button>
        </div>

        <nav className={`flex flex-1 flex-col gap-1 ${sidebarCollapsed ? 'px-1.5 py-3' : 'p-3'}`}>
          {isSuperadmin && (
            <NavLink
              to="/usuarios"
              title="Usuarios"
              className={({ isActive }) =>
                `${navBase} ${sidebarCollapsed ? navCollapsed : navExpanded} ${isActive ? linkActive : linkIdle}`
              }
            >
              <IconUsers className="h-5 w-5 shrink-0 opacity-90" />
              {!sidebarCollapsed && <span className="truncate">Usuarios</span>}
            </NavLink>
          )}
          {isSuperadmin && (
            <NavLink
              to="/logs"
              title="Auditoría"
              className={({ isActive }) =>
                `${navBase} ${sidebarCollapsed ? navCollapsed : navExpanded} ${isActive ? linkActive : linkIdle}`
              }
            >
              <IconScroll className="h-5 w-5 shrink-0 opacity-90" />
              {!sidebarCollapsed && <span className="truncate">Auditoría</span>}
            </NavLink>
          )}
          <NavLink
            to="/equipos"
            title="Equipos"
            className={({ isActive }) =>
              `${navBase} ${sidebarCollapsed ? navCollapsed : navExpanded} ${isActive ? linkActive : linkIdle}`
            }
          >
            <IconServer className="h-5 w-5 shrink-0 opacity-90" />
            {!sidebarCollapsed && <span className="truncate">Equipos</span>}
          </NavLink>
          <NavLink
            to="/credenciales"
            title="Credenciales"
            className={({ isActive }) =>
              `${navBase} ${sidebarCollapsed ? navCollapsed : navExpanded} ${isActive ? linkActive : linkIdle}`
            }
          >
            <IconKey className="h-5 w-5 shrink-0 opacity-90" />
            {!sidebarCollapsed && <span className="truncate">Credenciales</span>}
          </NavLink>
          <NavLink
            to="/perfil"
            title="Perfil"
            className={({ isActive }) =>
              `${navBase} ${sidebarCollapsed ? navCollapsed : navExpanded} ${isActive ? linkActive : linkIdle}`
            }
          >
            <IconUserCircle className="h-5 w-5 shrink-0 opacity-90" />
            {!sidebarCollapsed && <span className="truncate">Perfil</span>}
          </NavLink>
        </nav>

        <div
          className={`border-t border-slate-200/80 dark:border-surface-800 ${
            sidebarCollapsed ? 'flex flex-col items-center px-2 py-3' : 'p-4'
          }`}
        >
          {!sidebarCollapsed && (
            <>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {user?.nombre} {user?.apellido}
                </span>
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                  isSuperadmin
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                    : 'bg-slate-200/80 text-slate-600 dark:bg-surface-800 dark:text-slate-400'
                }`}
              >
                {user?.role ?? 'USER'}
              </span>
            </>
          )}
          {sidebarCollapsed && (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-surface-800 dark:text-slate-300"
              title={`${user?.nombre ?? ''} ${user?.apellido ?? ''} · ${user?.role ?? 'USER'}`}
            >
              {(user?.nombre?.[0] ?? '?').toUpperCase()}
            </span>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-surface-800 dark:bg-surface-900/90">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{pageTitle}</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-amber-500 shadow-sm transition hover:bg-slate-50 dark:border-surface-600 dark:bg-surface-800 dark:text-amber-300 dark:hover:bg-surface-700"
                title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              >
                {isDark ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                Salir
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
