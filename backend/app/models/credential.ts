import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Credential extends BaseModel {
  static table = 'credentials'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'company_id' })
  declare companyId: number | null

  @column()
  declare servicio: string

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

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
