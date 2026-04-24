import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import EquipoCredential from '#models/equipo_credential'

export default class EquipoCredentialViewer extends BaseModel {
  static table = 'equipo_credential_viewers'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'equipo_credential_id' })
  declare equipoCredentialId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => EquipoCredential, { foreignKey: 'equipoCredentialId' })
  declare equipoCredential: BelongsTo<typeof EquipoCredential>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
