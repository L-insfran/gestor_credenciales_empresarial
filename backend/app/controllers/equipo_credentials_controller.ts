import type { HttpContext } from '@adonisjs/core/http'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import Equipo from '#models/equipo'
import EquipoAccess from '#models/equipo_access'
import EquipoCredential from '#models/equipo_credential'
import EquipoCredentialViewer from '#models/equipo_credential_viewer'
import User from '#models/user'
import { storeEquipoCredentialValidator, updateEquipoCredentialValidator } from '#validators/equipo_credential'
import { decrypt, encrypt } from '#services/encryption_service'
import LoggerService from '#services/logger_service'
import { AuditAction } from '#constants/audit_actions'
import EquipoAclService from '#services/equipo_acl_service'

function canAssignEquipoAccess(equipo: Equipo, user: User) {
  return user.role === 'SUPERADMIN' || equipo.ownerUserId === user.id
}

function viewerDtosFromCredential(row: EquipoCredential) {
  const vs = (row as EquipoCredential & { viewers?: EquipoCredentialViewer[] }).viewers
  if (!vs?.length) return []
  return vs.map((v) => ({
    id: v.id,
    userId: v.userId,
    user: v.user
      ? { id: v.user.id, nombre: v.user.nombre, apellido: v.user.apellido, email: v.user.email }
      : null,
  }))
}

function toDto(row: EquipoCredential) {
  return {
    id: row.id,
    equipoId: row.equipoId,
    isShared: row.targetUserId == null,
    targetUserId: row.targetUserId,
    username: row.username,
    password: decrypt(row.passwordEncrypted),
    url: row.url,
    notas: row.notas,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    viewers: viewerDtosFromCredential(row),
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

async function assertViewersHaveEquipoAccess(equipoId: number, userIds: number[]) {
  if (userIds.length === 0) return { valid: true as const }
  const unique = [...new Set(userIds)]
  const found = await EquipoAccess.query()
    .select('user_id')
    .where('equipo_id', equipoId)
    .whereIn('user_id', unique)
  const ok = new Set(found.map((r) => r.userId))
  const missing = unique.filter((id) => !ok.has(id))
  if (missing.length) {
    return { valid: false as const, missing }
  }
  return { valid: true as const }
}

async function syncViewers(
  equipoCredentialId: number,
  userIds: number[],
  client: TransactionClientContract
) {
  await EquipoCredentialViewer.query({ client })
    .where('equipo_credential_id', equipoCredentialId)
    .delete()
  if (userIds.length === 0) return
  for (const userId of [...new Set(userIds)]) {
    await EquipoCredentialViewer.create(
      { equipoCredentialId, userId },
      { client }
    )
  }
}

export default class EquipoCredentialsController {
  async index({ params, request, response, jwtUser }: HttpContext) {
    const equipoId = Number(params.id)
    const equipo = await Equipo.find(equipoId)
    if (!equipo) return response.notFound({ message: 'Equipo no encontrado' })

    if (!(await canViewEquipo(jwtUser!, equipo))) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const q = EquipoCredential.query()
      .where('equipo_id', equipoId)
      .preload('viewers', (vq) => vq.preload('user', (u) => u.select('id', 'nombre', 'apellido', 'email')))

    if (jwtUser!.role === 'SUPERADMIN') {
      const targetUserId = request.input('targetUserId')
      if (targetUserId !== undefined && targetUserId !== null && targetUserId !== '') {
        q.where('target_user_id', Number(targetUserId))
      }
    } else {
      const uid = jwtUser!.id
      q.where((sub) => {
        sub
          .where('target_user_id', uid)
          .orWhere((s2) => {
            s2
              .whereNull('target_user_id')
              .where((s3) => {
                s3
                  .whereRaw(
                    'exists (select 1 from equipos e where e.id = equipo_credentials.equipo_id and e.owner_user_id = ?)',
                    [uid]
                  )
                  .orWhereRaw(
                    'exists (select 1 from equipo_credential_viewers ecv where ecv.equipo_credential_id = equipo_credentials.id and ecv.user_id = ?)',
                    [uid]
                  )
              })
          })
      })
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
    const isShared = Boolean(data.isShared)

    if (isShared) {
      if (!canAssignEquipoAccess(equipo, jwtUser!)) {
        return response.forbidden({ message: 'Solo el dueño del equipo o un administrador puede crear credenciales compartidas' })
      }
      if (data.targetUserId != null) {
        return response.badRequest({ message: 'Una credencial compartida no puede tener usuario asignado' })
      }
    }

    let targetUserId: number | null = jwtUser!.id
    if (!isShared) {
      if (data.targetUserId !== undefined) {
        if (data.targetUserId === null) {
          return response.badRequest({ message: 'Indica credencial compartida o un usuario destino' })
        }
        const asSuperadmin = jwtUser!.role === 'SUPERADMIN'
        const asEquipoAdmin = !asSuperadmin && (await EquipoAclService.canAdmin(jwtUser!, equipo))
        if (!asSuperadmin && !asEquipoAdmin) {
          return response.forbidden({ message: 'No puedes asignar credenciales a otro usuario' })
        }
        const target = await User.find(data.targetUserId)
        if (!target) return response.badRequest({ message: 'Usuario destino no encontrado' })
        if (asEquipoAdmin && !asSuperadmin) {
          if (target.id === equipo.ownerUserId) {
            /* dueño: implícitamente con acceso */
          } else {
            const hasAccess = await EquipoAccess.query()
              .select('id')
              .where('equipo_id', equipoId)
              .where('user_id', target.id)
              .first()
            if (!hasAccess) {
              return response.badRequest({
                message: 'El usuario destino no tiene acceso a este equipo',
              })
            }
          }
        }
        targetUserId = target.id
      } else {
        targetUserId = jwtUser!.id
      }
    } else {
      targetUserId = null
    }

    const viewerUserIds = [...new Set(data.viewerUserIds ?? [])] as number[]
    if (isShared) {
      const check = await assertViewersHaveEquipoAccess(equipoId, viewerUserIds)
      if (!check.valid) {
        return response.badRequest({
          message: 'Todos los visores deben tener acceso al equipo',
          detalle: { userIds: check.missing },
        })
      }
    }

    const cred = await db.transaction(async (trx) => {
      const c = await EquipoCredential.create(
        {
          equipoId,
          targetUserId,
          username: data.username,
          passwordEncrypted: encrypt(data.password),
          url: data.url ?? null,
          notas: data.notas ?? null,
        },
        { client: trx }
      )
      if (isShared) {
        await syncViewers(c.id, viewerUserIds, trx)
      }
      return c
    })

    if (isShared) {
      await cred.load('viewers', (vq) => vq.preload('user', (u) => u.select('id', 'nombre', 'apellido', 'email')))
    }

    await LoggerService.log(jwtUser!.id, AuditAction.CREATE_EQUIPO_CREDENTIAL, request, {
      equipoId,
      equipoCredentialId: cred.id,
      targetUserId,
      isShared,
      viewerUserIds: isShared ? viewerUserIds : undefined,
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

    if (!(await canViewEquipo(jwtUser!, equipo))) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const wasShared = cred.targetUserId == null
    if (wasShared) {
      const isAdmin = await EquipoAclService.canAdmin(jwtUser!, equipo)
      if (jwtUser!.role !== 'SUPERADMIN' && !isAdmin) {
        return response.forbidden({ message: 'No autorizado' })
      }
    } else if (jwtUser!.role !== 'SUPERADMIN') {
      if (cred.targetUserId !== jwtUser!.id) {
        return response.forbidden({ message: 'No autorizado' })
      }
    }

    const data = await request.validateUsing(updateEquipoCredentialValidator)

    // Personal → compartida: poner target_user_id en null y persistir visores
    if (data.isShared === true && !wasShared) {
      if (!canAssignEquipoAccess(equipo, jwtUser!)) {
        return response.forbidden({
          message: 'Solo el dueño del equipo o un administrador puede marcar la credencial como compartida',
        })
      }
      const vids = data.viewerUserIds ?? []
      const check = await assertViewersHaveEquipoAccess(equipoId, vids)
      if (!check.valid) {
        return response.badRequest({
          message: 'Todos los visores deben tener acceso al equipo',
          detalle: { userIds: check.missing },
        })
      }
      if (data.username !== undefined) cred.username = data.username
      if (data.url !== undefined) cred.url = data.url
      if (data.notas !== undefined) cred.notas = data.notas
      if (data.password !== undefined) cred.passwordEncrypted = encrypt(data.password)
      await db.transaction(async (trx) => {
        cred.useTransaction(trx)
        cred.targetUserId = null
        await cred.save()
        await syncViewers(credId, vids, trx)
      })
      await cred.refresh()
      await cred.load('viewers', (vq) => vq.preload('user', (u) => u.select('id', 'nombre', 'apellido', 'email')))
      await LoggerService.log(jwtUser!.id, AuditAction.UPDATE_EQUIPO_CREDENTIAL, request, {
        equipoId,
        equipoCredentialId: cred.id,
        convertToShared: true,
        viewerUserIds: vids,
      })
      return response.ok({ credential: toDto(cred) })
    }

    if (data.viewerUserIds !== undefined && !wasShared) {
      return response.badRequest({
        message:
          'Solo aplica a credenciales compartidas. Si querés compartir una credencial personal, enviá isShared: true y viewerUserIds.',
      })
    }

    if (data.viewerUserIds !== undefined) {
      if (!canAssignEquipoAccess(equipo, jwtUser!)) {
        return response.forbidden({ message: 'Solo el dueño del equipo o un administrador puede cambiar visores' })
      }
      const check = await assertViewersHaveEquipoAccess(equipoId, data.viewerUserIds)
      if (!check.valid) {
        return response.badRequest({
          message: 'Todos los visores deben tener acceso al equipo',
          detalle: { userIds: check.missing },
        })
      }
    }

    if (data.username !== undefined) cred.username = data.username
    if (data.url !== undefined) cred.url = data.url
    if (data.notas !== undefined) cred.notas = data.notas
    if (data.password !== undefined) cred.passwordEncrypted = encrypt(data.password)

    await db.transaction(async (trx) => {
      cred.useTransaction(trx)
      await cred.save()
      if (wasShared && data.viewerUserIds !== undefined) {
        await syncViewers(credId, data.viewerUserIds, trx)
      }
    })

    if (wasShared) {
      await cred.refresh()
      await cred.load('viewers', (vq) => vq.preload('user', (u) => u.select('id', 'nombre', 'apellido', 'email')))
    }

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

    if (!(await canViewEquipo(jwtUser!, equipo))) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const isShared = cred.targetUserId == null
    if (isShared) {
      const isAdmin = await EquipoAclService.canAdmin(jwtUser!, equipo)
      if (jwtUser!.role !== 'SUPERADMIN' && !isAdmin) {
        return response.forbidden({ message: 'No autorizado' })
      }
    } else if (jwtUser!.role !== 'SUPERADMIN') {
      if (cred.targetUserId !== jwtUser!.id) {
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
