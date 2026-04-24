import vine from '@vinejs/vine'

const emailRule = () => vine.string().email().maxLength(254)
const passwordRule = () => vine.string().minLength(8).maxLength(128)

export const loginValidator = vine.create({
  email: emailRule(),
  password: vine.string(),
})

export const storeUserValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(120),
  apellido: vine.string().trim().minLength(1).maxLength(120),
  email: emailRule().unique({ table: 'users', column: 'email' }),
  password: passwordRule(),
  role: vine.enum(['USER', 'SUPERADMIN'] as const),
  activo: vine.boolean().optional(),
})

export const updateUserValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(120).optional(),
  apellido: vine.string().trim().minLength(1).maxLength(120).optional(),
  email: emailRule().optional(),
  password: passwordRule().optional(),
  role: vine.enum(['USER', 'SUPERADMIN'] as const).optional(),
  companyId: vine.number().positive().optional().nullable(),
  activo: vine.boolean().optional(),
})

/** Actualización de perfil (usuario autenticado, sin cambiar rol). */
export const updateProfileValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(120).optional(),
  apellido: vine.string().trim().minLength(1).maxLength(120).optional(),
  email: emailRule().optional(),
  password: passwordRule().optional(),
})

export const loginTotpValidator = vine.create({
  pendingToken: vine.string().minLength(20),
  code: vine.string().regex(/^\d{6}$/),
})

export const refreshTokenBodyValidator = vine.create({
  refresh_token: vine.string().minLength(20),
})

export const logoutBodyValidator = vine.create({
  refresh_token: vine.string().minLength(20).optional(),
})

export const totpCodeValidator = vine.create({
  code: vine.string().regex(/^\d{6}$/),
})

export const disable2faValidator = vine.create({
  password: vine.string().minLength(1).maxLength(128),
  code: vine
    .string()
    .regex(/^\d{6}$/)
    .optional(),
})
