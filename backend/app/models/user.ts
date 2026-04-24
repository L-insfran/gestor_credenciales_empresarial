import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Credential from '#models/credential'

export type UserRole = 'USER' | 'SUPERADMIN'

export default class User extends compose(BaseModel, withAuthFinder(hash)) {
  static table = 'users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare nombre: string

  @column()
  declare apellido: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: UserRole

  @column()
  declare activo: boolean

  @column({ columnName: 'company_id' })
  declare companyId: number | null

  @column({ columnName: 'two_factor_secret', serializeAs: null })
  declare twoFactorSecret: string | null

  @column({ columnName: 'two_factor_enabled' })
  declare twoFactorEnabled: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Credential)
  declare credentials: HasMany<typeof Credential>

  get initials() {
    const n = (this.nombre || '')[0] || ''
    const a = (this.apellido || '')[0] || ''
    const pair = `${n}${a}`.toUpperCase()
    if (pair.length >= 2) {
      return pair
    }
    return this.email.slice(0, 2).toUpperCase()
  }
}
