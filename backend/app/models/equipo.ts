import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import EquipoAccess from '#models/equipo_access'
import EquipoCredential from '#models/equipo_credential'

export type EquipoTipo =
  | 'SERVIDOR'
  | 'ACCESS_POINT'
  | 'IMPRESORA'
  | 'WIFI'
  | 'VM'
  | 'ISP'
  | 'MANAGEMENT'
  | 'OTRO'

export default class Equipo extends BaseModel {
  static table = 'equipos'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'owner_user_id' })
  declare ownerUserId: number

  @column()
  declare nombre: string

  @column()
  declare tipo: EquipoTipo | string

  @column()
  declare detalles: Record<string, unknown>

  @column({ columnName: 'is_private' })
  declare isPrivate: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'ownerUserId' })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => EquipoAccess, { foreignKey: 'equipoId' })
  declare accesses: HasMany<typeof EquipoAccess>

  @hasMany(() => EquipoCredential, { foreignKey: 'equipoId' })
  declare credentials: HasMany<typeof EquipoCredential>
}

