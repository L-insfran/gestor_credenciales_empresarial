import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'equipo_credentials'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      table
        .integer('equipo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('equipos')
        .onDelete('CASCADE')
        .index()

      table
        .integer('target_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index()

      table.string('username', 255).notNullable()
      table.text('password_encrypted').notNullable()
      table.string('url', 2048).nullable()
      table.text('notas').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
