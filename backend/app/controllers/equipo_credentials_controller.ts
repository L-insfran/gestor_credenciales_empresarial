import type { HttpContext } from '@adonisjs/core/http'
import Equipo from '#models/equipo'
import EquipoAccess from '#models/equipo_access'
import EquipoCredential from '#models/equipo_credential'
import User from '#models/user'
import { storeEquipoCredentialValidator, updateEquipoCredentialValidator } from '#validators/equipo_credential'
import { decrypt, encrypt } from '#services/encryption_service'
import LoggerService from '#services/logger_service'
import { AuditAction } from '#constants/audit_actions'

function toDto(row: EquipoCredential) {
  return {
    id: row.id,
    equipoId: row.equipoId,
    targetUserId: row.targetUserId,
    username: row.username,
    password: decrypt(row.passwordEncrypted),
    url: row.url,
    notas: row.notas,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function canViewEquipo(jwtUser: User, equipo: Equipo): Promise<boolean> {
  if (jwtUser.role === 'SUPERADMIN') return true
  if (equipo.ownerUserId === jwtUser.id) return true
  const access = await EquipoAccess.query()
    .select('id')
    .where('equipo_id', equipo.id)
    .where('user_id', jwtUser.id)
    .first()
  return Boolean(access)
}

export default class EquipoCredentialsController {
  async index({ params, request, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    if (!(await canViewEquipo(jwtUser!, equipo))) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const q = EquipoCredential.query().where('equipo_id', equipoId)
    if (jwtUser!.role !== 'SUPERADMIN') {
      q.where('target_user_id', jwtUser!.id)
    } else {
      const targetUserId = request.input('targetUserId')
      if (targetUserId !== undefined && targetUserId !== null && targetUserId !== '') {
        q.where('target_user_id', Number(targetUserId))
      }
    }

    const rows = await q.orderBy('created_at', 'desc')

    await LoggerService.log(jwtUser!.id, AuditAction.VIEW_EQUIPO_CREDENTIALS, request, {
      equipoId,
      count: rows.length,
    })

    return response.ok({ credentials: rows.map(toDto) })
  }

  async store({ params, request, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    if (!(await canViewEquipo(jwtUser!, equipo))) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const data = await request.validateUsing(storeEquipoCredentialValidator)

    let targetUserId: number | null = jwtUser!.id
    if (data.targetUserId !== undefined) {
      if (jwtUser!.role !== 'SUPERADMIN') {
        return response.forbidden({ message: 'No puedes asignar credenciales a otro usuario' })
      }
      if (data.targetUserId === null) {
        targetUserId = null
      } else {
        const target = await User.find(data.targetUserId)
        if (!target) return response.badRequest({ message: 'Usuario destino no encontrado' })
        targetUserId = target.id
      }
    }

    const cred = await EquipoCredential.create({
      equipoId,
      targetUserId,
      username: data.username,
      passwordEncrypted: encrypt(data.password),
      url: data.url ?? null,
      notas: data.notas ?? null,
    })

    await LoggerService.log(jwtUser!.id, AuditAction.CREATE_EQUIPO_CREDENTIAL, request, {
      equipoId,
      equipoCredentialId: cred.id,
      targetUserId,
    })

    return response.created({ credential: toDto(cred) })
  }

  async update({ params, request, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const credId = Number(params.credId)

    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    const cred = await EquipoCredential.query()
      .where('id', credId)
      .where('equipo_id', equipoId)
      .first()
    if (!cred) return response.notFound({ message: 'Credencial no encontrada' })

    if (jwtUser!.role !== 'SUPERADMIN') {
      if (cred.targetUserId !== jwtUser!.id) {
        return response.forbidden({ message: 'No autorizado' })
      }
      // Un usuario puede editar su propia credencial si puede ver el equipo (por ejemplo, si es su equipo privado u obtuvo acceso).
      if (!(await canViewEquipo(jwtUser!, equipo))) {
        return response.forbidden({ message: 'No autorizado' })
      }
    } else {
      if (!(await canViewEquipo(jwtUser!, equipo))) {
        return response.forbidden({ message: 'No autorizado' })
      }
    }

    const data = await request.validateUsing(updateEquipoCredentialValidator)
    if (data.username !== undefined) cred.username = data.username
    if (data.url !== undefined) cred.url = data.url
    if (data.notas !== undefined) cred.notas = data.notas
    if (data.password !== undefined) cred.passwordEncrypted = encrypt(data.password)
    await cred.save()

    await LoggerService.log(jwtUser!.id, AuditAction.UPDATE_EQUIPO_CREDENTIAL, request, {
      equipoId,
      equipoCredentialId: cred.id,
    })

    return response.ok({ credential: toDto(cred) })
  }

  async destroy({ params, request, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const credId = Number(params.credId)

    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    const cred = await EquipoCredential.query()
      .where('id', credId)
      .where('equipo_id', equipoId)
      .first()
    if (!cred) return response.notFound({ message: 'Credencial no encontrada' })

    if (jwtUser!.role !== 'SUPERADMIN') {
      if (cred.targetUserId !== jwtUser!.id) {
        return response.forbidden({ message: 'No autorizado' })
      }
      if (!(await canViewEquipo(jwtUser!, equipo))) {
        return response.forbidden({ message: 'No autorizado' })
      }
    } else {
      if (!(await canViewEquipo(jwtUser!, equipo))) {
        return response.forbidden({ message: 'No autorizado' })
      }
    }

    await cred.delete()
    await LoggerService.log(jwtUser!.id, AuditAction.DELETE_EQUIPO_CREDENTIAL, request, {
      equipoId,
      equipoCredentialId: credId,
    })

    return response.ok({ message: 'Credencial eliminada' })
  }
}

