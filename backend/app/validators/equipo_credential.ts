import vine from '@vinejs/vine'

export const storeEquipoCredentialValidator = vine.create({
  username: vine.string().trim().minLength(1).maxLength(255),
  password: vine.string().minLength(1).maxLength(2048),
  url: vine.string().trim().maxLength(2048).optional().nullable(),
  notas: vine.string().trim().maxLength(10000).optional().nullable(),
  /** Solo SUPERADMIN puede crear credenciales para otro usuario */
  targetUserId: vine.number().positive().optional().nullable(),
})

export const updateEquipoCredentialValidator = vine.create({
  username: vine.string().trim().minLength(1).maxLength(255).optional(),
  password: vine.string().minLength(1).maxLength(2048).optional(),
  url: vine.string().trim().maxLength(2048).optional().nullable(),
  notas: vine.string().trim().maxLength(10000).optional().nullable(),
})

