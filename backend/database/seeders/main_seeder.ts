import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

/**
 * El mixin `withAuthFinder` hashea la contraseña en `beforeSave`.
 * Nunca uses `hash.make()` aquí: se guardaría un hash del hash y el login fallaría.
 *
 * Cada ejecución del seeder deja la contraseña del admin en el valor de desarrollo
 * documentado en el README (útil tras corregir el doble hash).
 */
export default class extends BaseSeeder {
  async run() {
    const email = 'admin@empresa.local'
    const plainPassword = 'Admin123!'

    let user = await User.findBy('email', email)
    if (!user) {
      await User.create({
        nombre: 'Super',
        apellido: 'Administrador',
        email,
        password: plainPassword,
        role: 'SUPERADMIN',
        companyId: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
      })
      return
    }

    user.password = plainPassword
    await user.save()
  }
}
