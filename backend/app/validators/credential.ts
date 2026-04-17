import vine from '@vinejs/vine'

export const storeCredentialValidator = vine.create({
  servicio: vine.string().trim().minLength(1).maxLength(255),
  username: vine.string().trim().minLength(1).maxLength(255),
  password: vine.string().minLength(1).maxLength(2048),
  url: vine.string().trim().maxLength(2048).optional().nullable(),
  notas: vine.string().trim().maxLength(10000).optional().nullable(),
  /** Solo SUPERADMIN puede asignar credencial a otro usuario */
  userId: vine.number().positive().optional(),
})

export const updateCredentialValidator = vine.create({
  servicio: vine.string().trim().minLength(1).maxLength(255).optional(),
  username: vine.string().trim().minLength(1).maxLength(255).optional(),
  password: vine.string().minLength(1).maxLength(2048).optional(),
  url: vine.string().trim().maxLength(2048).optional().nullable(),
  notas: vine.string().trim().maxLength(10000).optional().nullable(),
})
