import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Equipo from '#models/equipo'
import EquipoAccess from '#models/equipo_access'
import EquipoCredentialViewer from '#models/equipo_credential_viewer'
import User from '#models/user'
import { grantEquipoAccessValidator } from '#validators/equipo_access'
import LoggerService from '#services/logger_service'
import { AuditAction } from '#constants/audit_actions'
import EquipoAclService from '#services/equipo_acl_service'

function accessDto(row: EquipoAccess) {
  return {
    id: row.id,
    equipoId: row.equipoId,
    userId: row.userId,
    accessLevel: row.accessLevel,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export default class EquipoAccessController {
  async index({ params, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    const canList =
      jwtUser!.role === 'SUPERADMIN' ||
      equipo.ownerUserId === jwtUser!.id ||
      (await EquipoAclService.canAdmin(jwtUser!, equipo))
    if (!canList) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const rows = await EquipoAccess.query()
      .where('equipo_id', equipoId)
      .preload('user', (uq) => uq.select('id', 'nombre', 'apellido', 'email', 'role'))
      .orderBy('id', 'asc')

    return response.ok({
      equipo: { id: equipo.id, nombre: equipo.nombre },
      accesses: rows.map((a) => ({
        ...accessDto(a),
        user: a.user
          ? {
              id: a.user.id,
              nombre: a.user.nombre,
              apellido: a.user.apellido,
              email: a.user.email,
              role: a.user.role,
            }
          : null,
      })),
    })
  }

  async store({ params, request, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    if (jwtUser!.role !== 'SUPERADMIN' && equipo.ownerUserId !== jwtUser!.id) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const data = await request.validateUsing(grantEquipoAccessValidator)
    const target = await User.find(data.userId)
    if (!target) return response.badRequest({ message: 'Usuario destino no encontrado' })

    const access = await EquipoAccess.updateOrCreate(
      { equipoId, userId: target.id },
      { accessLevel: data.accessLevel ?? 'VIEW' }
    )

    await LoggerService.log(jwtUser!.id, AuditAction.GRANT_EQUIPO_ACCESS, request, {
      equipoId,
      targetUserId: target.id,
      accessLevel: access.accessLevel,
    })

    return response.created({ access: accessDto(access) })
  }

  async destroy({ params, request, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const targetUserId = Number(params.userId)

    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    if (jwtUser!.role !== 'SUPERADMIN' && equipo.ownerUserId !== jwtUser!.id) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const access = await EquipoAccess.query()
      .where('equipo_id', equipoId)
      .where('user_id', targetUserId)
      .first()

    if (!access) {
      return response.notFound({ message: 'Acceso no encontrado' })
    }

    await access.delete()

    await EquipoCredentialViewer.query()
      .whereIn(
        'equipo_credential_id',
        db
          .from('equipo_credentials')
          .select('id')
          .where('equipo_id', equipoId)
          .whereNull('target_user_id')
      )
      .where('user_id', targetUserId)
      .delete()

    await LoggerService.log(jwtUser!.id, AuditAction.REVOKE_EQUIPO_ACCESS, request, {
      equipoId,
      targetUserId,
    })

    return response.ok({ message: 'Acceso revocado' })
  }
}

