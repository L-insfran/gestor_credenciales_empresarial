import vine from '@vinejs/vine'

const tipoEnum = ['SERVIDOR', 'ACCESS_POINT', 'IMPRESORA', 'OTRO'] as const

export const storeEquipoValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(255),
  tipo: vine.enum(tipoEnum),
  detalles: vine.any().optional(),
  /** Solo SUPERADMIN puede crear equipos no privados de forma explícita */
  isPrivate: vine.boolean().optional(),
})

export const updateEquipoValidator = vine.create({
  nombre: vine.string().trim().minLength(1).maxLength(255).optional(),
  tipo: vine.enum(tipoEnum).optional(),
  detalles: vine.any().optional(),
  isPrivate: vine.boolean().optional(),
})

