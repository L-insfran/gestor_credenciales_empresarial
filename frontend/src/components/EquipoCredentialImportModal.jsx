import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { api, getApiErrorMessage } from '../services/api'

function getCell(row, ...aliases) {
  for (const key of Object.keys(row)) {
    const k = key.trim().toLowerCase()
    for (const a of aliases) {
      if (k === a.toLowerCase()) {
        const v = row[key]
        if (v == null) return ''
        if (typeof v === 'number' && !Number.isNaN(v)) return String(v).trim()
        return String(v).trim()
      }
    }
  }
  return ''
}

function parseWorkbookToRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const name = workbook.SheetNames[0]
  if (!name) {
    return { error: 'El archivo no contiene hojas.' }
  }
  const sheet = workbook.Sheets[name]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  if (!Array.isArray(json) || json.length === 0) {
    return { error: 'La primera hoja está vacía o no tiene encabezados con datos.' }
  }
  return { rows: json }
}

function buildEmailToUser(members) {
  const map = new Map()
  for (const u of members) {
    if (u?.email) map.set(String(u.email).trim().toLowerCase(), u)
  }
  return map
}

/** Nivel de acceso al equipo (lectura/escritura en la app). Default VIEW. */
function parseTeamAccessLevel(raw) {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase()
  if (!s) return { level: 'VIEW', error: null }
  if (['EDIT', 'ESCRITURA', 'MOD', 'ESCRIT'].includes(s)) return { level: 'EDIT', error: null }
  if (['VIEW', 'LECTURA', 'VER', 'READ', 'READONLY', 'SOLO LECTURA'].includes(s)) {
    return { level: 'VIEW', error: null }
  }
  return { level: null, error: 'nivel de acceso al equipo inválido (usá VIEW o EDIT, o vacío para VIEW)' }
}

function buildPreview(excelRows, { emailToUser, canAssignToOthers, currentUser, extraLookup }) {
  const out = []
  for (let i = 0; i < excelRows.length; i++) {
    const row = excelRows[i]
    const sheetRow = i + 2
    let email = getCell(row, 'email', 'e-mail', 'correo', 'correo electrónico', 'correo electronico', 'usuario asignado')
    email = email.toLowerCase()
    const userLogin = getCell(
      row,
      'user',
      'usuario',
      'username',
      'login',
      'nombre de usuario',
      'Usuario (login/servicio)'
    )
    const password = getCell(
      row,
      'password',
      'contraseña',
      'contrasena',
      'pass',
      'clave'
    )
    const url = getCell(row, 'url', 'enlace', 'dirección', 'direccion', 'link', 'web') || null
    const notas = getCell(row, 'notas', 'nota', 'observaciones', 'comentarios', 'descripcion', 'descripción') || null
    const teamAccessRaw = getCell(
      row,
      'nivel acceso equipo',
      'acceso al equipo',
      'nivel acceso',
      'acceso equipo',
      'team access',
      'access level'
    )
    const { level: teamAccessLevel, error: teamAccessError } = parseTeamAccessLevel(teamAccessRaw)

    const errParts = []
    if (!email) errParts.push('falta email')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errParts.push('email inválido')
    if (!userLogin) errParts.push('falta usuario (login/servicio)')
    if (!password) errParts.push('falta contraseña')
    if (teamAccessError) errParts.push(teamAccessError)
    if (email && !errParts.includes('falta email') && !errParts.includes('email inválido')) {
      let u = emailToUser.get(email)
      if (!u && extraLookup) u = extraLookup.get(email)
      if (!u) errParts.push('email no reconocido (miembro del equipo o catálogo de usuarios, según permisos)')
      else if (!canAssignToOthers && currentUser?.email) {
        const me = String(currentUser.email).toLowerCase()
        if (email !== me) errParts.push('solo podés importar filas con tu email')
      }
    }

    out.push({
      sheetRow,
      email,
      userLogin,
      password,
      url: url && String(url).trim() ? String(url).trim() : null,
      notas: notas && String(notas).trim() ? String(notas).trim() : null,
      teamAccessLevel: teamAccessLevel ?? 'VIEW',
      error: errParts.length ? errParts.join('; ') : null,
    })
  }
  return out
}

// Evitar "duplicado mismo usuario" falso: solo advertimos filas con mismo email+user service duplicado
function buildPreviewFixed(excelRows, ctx) {
  const base = buildPreview(excelRows, ctx)
  const { emailToUser, canAssignToOthers, currentUser, extraLookup } = ctx
  const byUserRow = new Map()
  for (const r of base) {
    if (r.error) continue
    const u = emailToUser.get(r.email) || extraLookup?.get(r.email)
    if (!u?.id) continue
    const k = `${u.id}::${r.userLogin}::${r.url ?? ''}`
    if (byUserRow.has(k)) {
      r.error = (r.error ? r.error + '; ' : '') + 'fila duplicada (mismo usuario, login y url que otra fila)'
    } else {
      byUserRow.set(k, r.sheetRow)
    }
  }
  return base
}

function groupFailedByMessage(failed) {
  const map = new Map()
  for (const f of failed) {
    const key = f.message || 'Error desconocido'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(f)
  }
  return Array.from(map.entries())
}

function downloadTemplate() {
  const data = [
    [
      'Email',
      'Usuario (login/servicio)',
      'Contraseña',
      'Nivel acceso equipo',
      'Url',
      'Notas',
    ],
    [
      'ana@empresa.com',
      'ana.servicio',
      'secreto',
      'VIEW',
      'https://app.ejemplo.com',
      'Cuenta producción',
    ],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Credenciales')
  XLSX.writeFile(wb, 'plantilla_importar_credenciales_equipo.xlsx')
}

function LoadingSpinner() {
  return (
    <div
      className="h-12 w-12 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-surface-600 dark:border-t-indigo-400"
      aria-hidden
    />
  )
}

export default function EquipoCredentialImportModal({
  open,
  onClose,
  onImported,
  flash,
  equipoId,
  teamMembers = [],
  userOptions = [],
  canAssignToOthers = false,
  isSuperadmin = false,
  currentUser = null,
  canGrantEquipoAccess = false,
}) {
  const [fileLabel, setFileLabel] = useState('')
  const [preview, setPreview] = useState([])
  const [parseError, setParseError] = useState(null)
  const [readingFile, setReadingFile] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importResult, setImportResult] = useState(null)
  const wasOpenRef = useRef(false)

  const emailToMember = useMemo(() => buildEmailToUser(teamMembers), [teamMembers])
  const extraLookup = useMemo(() => {
    if (!isSuperadmin) return null
    return buildEmailToUser(userOptions)
  }, [isSuperadmin, userOptions])

  useEffect(() => {
    if (open) {
      if (!wasOpenRef.current) {
        setFileLabel('')
        setPreview([])
        setParseError(null)
        setReadingFile(false)
        setImporting(false)
        setImportResult(null)
        setImportProgress({ current: 0, total: 0 })
      }
      wasOpenRef.current = true
    } else {
      wasOpenRef.current = false
    }
  }, [open])

  if (!open) return null

  const validRows = preview.filter((r) => !r.error)
  const invalidCount = preview.length - validRows.length
  const showResult = importResult != null
  const hasFailures = (importResult?.failed?.length ?? 0) > 0
  const hasSuccesses = (importResult?.succeeded?.length ?? 0) > 0

  const onPickFile = async (e) => {
    const f = e.target.files?.[0]
    setImportResult(null)
    setParseError(null)
    setPreview([])
    if (!f) {
      setFileLabel('')
      return
    }
    setFileLabel(f.name)
    setReadingFile(true)
    try {
      const buf = await f.arrayBuffer()
      const parsed = parseWorkbookToRows(buf)
      if (parsed.error) {
        setParseError(parsed.error)
        return
      }
      setPreview(
        buildPreviewFixed(parsed.rows, {
          emailToUser: emailToMember,
          extraLookup,
          canAssignToOthers,
          currentUser,
        })
      )
    } catch {
      setParseError('No se pudo leer el archivo. Usá un .xlsx o .xls válido.')
    } finally {
      setReadingFile(false)
    }
    e.target.value = ''
  }

  const resolveUserId = (email) => {
    const e = email.toLowerCase()
    const a = emailToMember.get(e)
    if (a) return a.id
    if (extraLookup) {
      const b = extraLookup.get(e)
      if (b) return b.id
    }
    return null
  }

  const runImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    setImportResult(null)
    setImportProgress({ current: 0, total: validRows.length })
    try {
      const payloadRows = validRows.map((r) => {
        const targetUserId = resolveUserId(r.email)
        return {
          sheetRow: r.sheetRow,
          email: r.email,
          userLogin: r.userLogin,
          password: r.password,
          accessLevel: r.teamAccessLevel === 'EDIT' ? 'EDIT' : 'VIEW',
          url: r.url,
          notas: r.notas,
          targetUserId,
        }
      })

      const unresolved = payloadRows.find((r) => r.targetUserId == null)
      if (unresolved) {
        setImportResult({
          created: 0,
          failed: [
            {
              sheetRow: unresolved.sheetRow,
              email: unresolved.email,
              message: 'No se pudo resolver el usuario',
            },
          ],
          succeeded: [],
          totalAttempted: 0,
          skippedInPreview: invalidCount,
          accessGranted: 0,
        })
        flash?.('error', 'No se pudo completar la importación. Hay filas con email no resoluble.')
        return
      }

      const { data } = await api.post(`/equipos/${equipoId}/credenciales/import`, {
        grantEquipoAccess: Boolean(canGrantEquipoAccess),
        rows: payloadRows,
      })

      setImportProgress({ current: validRows.length, total: validRows.length })

      const result = {
        created: data.created ?? 0,
        failed: data.failed ?? [],
        succeeded: data.succeeded ?? [],
        totalAttempted: data.totalAttempted ?? payloadRows.length,
        skippedInPreview: invalidCount,
        accessGranted: data.accessGranted ?? 0,
      }
      setImportResult(result)

      if ((result.failed?.length ?? 0) === 0) {
        const extra =
          canGrantEquipoAccess && (result.accessGranted ?? 0) > 0
            ? ` Se otorgó acceso al equipo a ${result.accessGranted} usuario(s).`
            : ''
        flash?.('success', `Se importaron ${result.created} credencial(es) correctamente.${extra}`)
      } else if ((result.created ?? 0) > 0) {
        flash?.(
          'error',
          `Importación parcial: ${result.created} creadas, ${result.failed.length} con error. Revisá el resumen.`
        )
      } else {
        flash?.('error', 'No se pudo completar la importación. Revisá el resumen de errores.')
      }

      if (onImported) onImported({ created: result.created, failed: result.failed, totalAttempted: result.totalAttempted })
    } catch (e) {
      flash?.('error', getApiErrorMessage(e))
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    if (importing || readingFile) return
    setFileLabel('')
    setPreview([])
    setParseError(null)
    setImportResult(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-900">
        {readingFile && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 p-6 text-center dark:bg-surface-900/95"
            role="status"
            aria-live="polite"
          >
            <LoadingSpinner />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Leyendo la planilla…</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Procesando el archivo en tu dispositivo</p>
          </div>
        )}
        {importing && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/92 p-6 text-center dark:bg-surface-900/95"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <LoadingSpinner />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {canGrantEquipoAccess ? 'Importando accesos y credenciales…' : 'Importando credenciales…'}
            </p>
            {importProgress.total > 0 ? (
              <p className="text-sm font-mono text-indigo-600 dark:text-indigo-300">
                {importProgress.current} / {importProgress.total} completados
              </p>
            ) : null}
            <div className="mt-1 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-slate-200 dark:bg-surface-700">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-200 dark:bg-indigo-500"
                style={{
                  width: importProgress.total
                    ? `${Math.min(100, (importProgress.current / importProgress.total) * 100)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Importar credenciales (Excel)</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Cada fila crea la credencial para el usuario del email. Columnas:{' '}
          <strong className="font-medium text-slate-800 dark:text-slate-200">Email</strong>,{' '}
          <strong className="font-medium text-slate-800 dark:text-slate-200">Usuario</strong> (login o servicio),{' '}
          <strong className="font-medium text-slate-800 dark:text-slate-200">Contraseña</strong>,{' '}
          <strong className="font-medium text-slate-800 dark:text-slate-200">Nivel acceso equipo</strong> (VIEW o EDIT;
          vacío = VIEW) para dar acceso a la app al mismo usuario si aún no lo tiene, y opcionales{' '}
          <strong className="font-medium text-slate-800 dark:text-slate-200">Url</strong> y{' '}
          <strong className="font-medium text-slate-800 dark:text-slate-200">Notas</strong>. Superadmin: se acepta
          email de usuarios del catálogo. Si el usuario todavía no estaba en el equipo, con permisos de gestión se le
          otorga el acceso al equipo y luego la credencial, en un solo paso.
        </p>
        {canGrantEquipoAccess ? (
          <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/80">
            Como podés gestionar el equipo, antes de cada credencial se asegura el acceso al equipo (solo si aún no lo
            tiene). No se baja de EDIT a VIEW si el usuario ya tenía otro nivel.
          </p>
        ) : null}
        {!canAssignToOthers && currentUser ? (
          <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
            Solo podés asignar credenciales a tu usuario: usá <span className="font-mono">{currentUser.email}</span> en
            Email.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadTemplate}
            disabled={readingFile || importing}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-surface-600 dark:text-slate-200 dark:hover:bg-surface-800"
          >
            Descargar plantilla
          </button>
          <label
            className={`inline-flex cursor-pointer items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 ${
              readingFile || importing ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={onPickFile}
              disabled={readingFile || importing}
            />
            Elegir Excel
          </label>
          {fileLabel ? <span className="text-sm text-slate-500 dark:text-slate-400">Archivo: {fileLabel}</span> : null}
        </div>

        {parseError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {parseError}
          </p>
        ) : null}

        {importResult && (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm dark:border-surface-600 dark:bg-surface-800/50">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Resumen de importación</p>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                <li>
                  <span className="text-emerald-700 dark:text-emerald-400">Credenciales creadas:</span>{' '}
                  <strong>{importResult.created}</strong> de {importResult.totalAttempted} enviados
                </li>
                {(importResult.accessGranted ?? 0) > 0 ? (
                  <li>
                    <span className="text-emerald-700 dark:text-emerald-400">Accesos nuevos al equipo:</span>{' '}
                    <strong>{importResult.accessGranted}</strong> (únicos en esta importación)
                  </li>
                ) : null}
                {importResult.skippedInPreview > 0 ? (
                  <li>
                    <span className="text-amber-700 dark:text-amber-300">Omitidos (vista prevía):</span>{' '}
                    <strong>{importResult.skippedInPreview}</strong>
                  </li>
                ) : null}
                {hasFailures ? (
                  <li>
                    <span className="text-red-700 dark:text-red-300">Rechazadas por el servidor:</span>{' '}
                    <strong>{importResult.failed.length}</strong>
                  </li>
                ) : null}
              </ul>
            </div>

            {hasSuccesses && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900/30 dark:bg-emerald-950/25 dark:text-emerald-100">
                <p className="font-medium">Credenciales creadas</p>
                <details className="mt-2" open={importResult.succeeded.length <= 12}>
                  <summary className="cursor-pointer text-xs text-emerald-800/90 dark:text-emerald-200/90">
                    Ver {importResult.succeeded.length} fila{importResult.succeeded.length === 1 ? '' : 's'}
                  </summary>
                  <ul className="mt-2 max-h-40 list-inside list-disc space-y-0.5 overflow-y-auto text-xs font-mono">
                    {importResult.succeeded.map((s) => (
                      <li key={`ok-${s.sheetRow}-${s.email}`}>
                        Fila {s.sheetRow}: {s.email} — {s.userLogin}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

            {hasFailures && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/35 dark:text-amber-100">
                <p className="font-medium">Errores (con motivo)</p>
                <div className="mt-3 space-y-3">
                  {groupFailedByMessage(importResult.failed).map(([msg, items]) => (
                    <div
                      key={msg}
                      className="rounded-lg border border-amber-300/50 bg-white/60 px-2 py-2 text-xs dark:border-amber-800/40 dark:bg-surface-900/50"
                    >
                      <p className="font-medium text-amber-900 dark:text-amber-200">{msg}</p>
                      <p className="mt-1 text-amber-800/90 dark:text-amber-100/90">
                        {items.length} fila{items.length === 1 ? '' : 's'}:{' '}
                        {items
                          .map((f) => `${f.sheetRow} (${f.email})`)
                          .slice(0, 25)
                          .join(' · ')}
                        {items.length > 25 ? ` · …y ${items.length - 25} más` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!showResult && preview.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vista prevía: {validRows.length} fila(s) lista(s)
              {invalidCount > 0 ? ` · ${invalidCount} con problemas (no se enviarán)` : ''}
            </p>
            <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-surface-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-surface-800/90">
                  <tr>
                    <th className="px-2 py-2 font-medium text-slate-500">#</th>
                    <th className="px-2 py-2 font-medium text-slate-500">Email</th>
                    <th className="px-2 py-2 font-medium text-slate-500">Usuario</th>
                    <th className="px-2 py-2 font-medium text-slate-500">Equipo</th>
                    <th className="px-2 py-2 font-medium text-slate-500">Url</th>
                    <th className="px-2 py-2 font-medium text-slate-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
                  {preview.map((r) => (
                    <tr key={r.sheetRow} className={r.error ? 'bg-red-50/80 dark:bg-red-950/20' : ''}>
                      <td className="px-2 py-1.5 text-slate-500">{r.sheetRow}</td>
                      <td className="px-2 py-1.5 font-mono text-slate-700 dark:text-slate-300">{r.email || '—'}</td>
                      <td className="px-2 py-1.5 text-slate-800 dark:text-slate-200">{r.userLogin || '—'}</td>
                      <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400">{r.teamAccessLevel ?? 'VIEW'}</td>
                      <td className="px-2 py-1.5 text-slate-500">{r.url || '—'}</td>
                      <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400">
                        {r.error || <span className="text-emerald-700 dark:text-emerald-400">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={importing || readingFile}
            className="rounded-lg px-4 py-2 text-sm text-slate-600 disabled:opacity-50 dark:text-slate-300"
          >
            {showResult ? 'Cerrar' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={runImport}
            disabled={importing || readingFile || validRows.length === 0 || showResult}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {importing ? 'Importando…' : `Importar ${validRows.length} credencial(es)`}
          </button>
        </div>
      </div>
    </div>
  )
}
