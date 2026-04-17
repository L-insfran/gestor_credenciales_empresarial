import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('nombre', 120).notNullable()
      table.string('apellido', 120).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('role', 32).notNullable().defaultTo('USER')
      /** Multi-empresa (SaaS): filtrar por organización en el futuro */
      table.integer('company_id').unsigned().nullable().index()
      /** Reservado para 2FA (TOTP/WebAuthn) */
      table.string('two_factor_secret').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
