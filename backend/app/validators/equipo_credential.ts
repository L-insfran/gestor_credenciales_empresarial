import vine from '@vinejs/vine'

export const storeEquipoCredentialValidator = vine.create({
  username: vine.string().trim().minLength(1).maxLength(255),
  password: vine.string().minLength(1).maxLength(2048),
  url: vine.string().trim().maxLength(2048).optional().nullable(),
  notas: vine.string().trim().maxLength(10000).optional().nullable(),
  /** Solo SUPERADMIN puede crear credenciales para otro usuario */
  targetUserId: vine.number().positive().optional().nullable(),
  /**
   * Credencial compartida del equipo: una sola clave, visibilidad con `viewerUserIds`
   * (owner del equipo o SUPERADMIN; mismos que gestionan accesos al equipo).
   */
  isShared: vine.boolean().optional(),
  /** Usuarios con acceso al equipo que podrán ver la credencial compartida. */
  viewerUserIds: vine.array(vine.number().positive()).optional(),
})

export const updateEquipoCredentialValidator = vine.create({
  username: vine.string().trim().minLength(1).maxLength(255).optional(),
  password: vine.string().minLength(1).maxLength(2048).optional(),
  url: vine.string().trim().maxLength(2048).optional().nullable(),
  notas: vine.string().trim().maxLength(10000).optional().nullable(),
  /** Pasa a compartida (quita asignación a un solo usuario) — requiere permiso de gestor del equipo. */
  isShared: vine.boolean().optional(),
  /** Sincronizar visores; en conversión a compartida, lista inicial de visores. */
  viewerUserIds: vine.array(vine.number().positive()).optional(),
})

