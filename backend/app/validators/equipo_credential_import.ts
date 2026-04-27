import vine from '@vinejs/vine'

export const importEquipoCredentialsValidator = vine.create({
  grantEquipoAccess: vine.boolean().optional(),
  rows: vine
    .array(
      vine.object({
        sheetRow: vine.number().positive().optional(),
        email: vine.string().trim().maxLength(320).optional(),
        userLogin: vine.string().trim().minLength(1).maxLength(255),
        password: vine.string().minLength(1).maxLength(2048),
        accessLevel: vine.enum(['VIEW', 'EDIT'] as const).optional(),
        url: vine.string().trim().maxLength(2048).optional().nullable(),
        notas: vine.string().trim().maxLength(10000).optional().nullable(),
        targetUserId: vine.number().positive(),
      })
    )
    .minLength(1)
    .maxLength(2000),
})

