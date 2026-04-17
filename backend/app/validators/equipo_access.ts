import vine from '@vinejs/vine'

export const grantEquipoAccessValidator = vine.create({
  userId: vine.number().positive(),
  accessLevel: vine.enum(['VIEW', 'EDIT'] as const).optional(),
})

