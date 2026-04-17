import vine from '@vinejs/vine'

export const createEquipoFromCredentialValidator = vine.create({
  credentialId: vine.number().positive(),
  nombre: vine.string().trim().minLength(1).maxLength(255).optional(),
  tipo: vine.enum(['SERVIDOR', 'ACCESS_POINT', 'IMPRESORA', 'OTRO'] as const).optional(),
  detalles: vine.any().optional(),
})

