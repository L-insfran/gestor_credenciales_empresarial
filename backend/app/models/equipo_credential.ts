import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Equipo from '#models/equipo'

export default class EquipoCredential extends BaseModel {
  static table = 'equipo_credentials'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'equipo_id' })
  declare equipoId: number

  @column({ columnName: 'target_user_id' })
  declare targetUserId: number | null

  @column()
  declare username: string

  @column({ columnName: 'password_encrypted', serializeAs: null })
  declare passwordEncrypted: string

  @column()
  declare url: string | null

  @column()
  declare notas: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Equipo, { foreignKey: 'equipoId' })
  declare equipo: BelongsTo<typeof Equipo>

  @belongsTo(() => User, { foreignKey: 'targetUserId' })
  declare targetUser: BelongsTo<typeof User>
}

