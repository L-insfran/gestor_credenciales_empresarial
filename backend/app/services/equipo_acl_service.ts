import Equipo from '#models/equipo'
import EquipoAccess from '#models/equipo_access'
import type User from '#models/user'

export default class EquipoAclService {
  static async canView(user: User, equipoIdOrEquipo: number | Equipo): Promise<boolean> {
    if (user.role === 'SUPERADMIN') return true

    const equipo =
      typeof equipoIdOrEquipo === 'number'
        ? await Equipo.query().select('id', 'owner_user_id').where('id', equipoIdOrEquipo).first()
        : equipoIdOrEquipo

    if (!equipo) return false
    if (equipo.ownerUserId === user.id) return true

    const access = await EquipoAccess.query()
      .select('id')
      .where('equipo_id', equipo.id)
      .where('user_id', user.id)
      .first()

    return Boolean(access)
  }

  static async canAdmin(user: User, equipoIdOrEquipo: number | Equipo): Promise<boolean> {
    if (user.role === 'SUPERADMIN') return true

    const equipo =
      typeof equipoIdOrEquipo === 'number'
        ? await Equipo.query().select('id', 'owner_user_id').where('id', equipoIdOrEquipo).first()
        : equipoIdOrEquipo

    if (!equipo) return false
    if (equipo.ownerUserId === user.id) return true

    const access = await EquipoAccess.query()
      .select('access_level')
      .where('equipo_id', equipo.id)
      .where('user_id', user.id)
      .first()

    return access?.accessLevel === 'EDIT'
  }
}

