import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Equipo from '#models/equipo'

export type EquipoAccessLevel = 'VIEW' | 'EDIT'

export default class EquipoAccess extends BaseModel {
  static table = 'equipo_access'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'equipo_id' })
  declare equipoId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'access_level' })
  declare accessLevel: EquipoAccessLevel | string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Equipo, { foreignKey: 'equipoId' })
  declare equipo: BelongsTo<typeof Equipo>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}

