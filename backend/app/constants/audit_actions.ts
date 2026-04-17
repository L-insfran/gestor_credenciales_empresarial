/** Acciones registradas en la tabla `logs` (auditoría). */
export const AuditAction = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  CREATE_CREDENTIAL: 'CREATE_CREDENTIAL',
  UPDATE_CREDENTIAL: 'UPDATE_CREDENTIAL',
  DELETE_CREDENTIAL: 'DELETE_CREDENTIAL',
  VIEW_CREDENTIALS: 'VIEW_CREDENTIALS',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]
