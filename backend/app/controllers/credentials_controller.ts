import Credential from '#models/credential'
import User from '#models/user'
import { storeCredentialValidator, updateCredentialValidator } from '#validators/credential'
import type { HttpContext } from '@adonisjs/core/http'
import { decrypt, encrypt } from '#services/encryption_service'
import { parsePagination, paginationMeta } from '#helpers/pagination'
import LoggerService from '#services/logger_service'
import { AuditAction } from '#constants/audit_actions'

/** Escapa `%`, `_` y `\` para usar en ILIKE … ESCAPE '\\'. */
function escapeLikeFragment(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function toDto(c: Credential) {
  return {
    id: c.id,
    userId: c.userId,
    servicio: c.servicio,
    username: c.username,
    password: decrypt(c.passwordEncrypted),
    url: c.url,
    notas: c.notas,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

export default class CredentialsController {
  async index({ request, response, jwtUser }: HttpContext) {
    const { page, perPage } = parsePagination(request)
    const q = Credential.query().preload('user')

    if (jwtUser!.role !== 'SUPERADMIN') {
      q.where('user_id', jwtUser!.id)
    } else {
      const userId = request.input('userId')
      if (userId !== undefined && userId !== null && userId !== '') {
        q.where('user_id', Number(userId))
      }
    }

    const servicio = String(request.input('servicio', '')).trim()
    if (servicio) {
      const pattern = `%${escapeLikeFragment(servicio)}%`
      q.whereRaw(`servicio ILIKE ? ESCAPE '\\'`, [pattern])
    }

    const paginator = await q.orderBy('created_at', 'desc').paginate(page, perPage)
    await LoggerService.log(jwtUser!.id, AuditAction.VIEW_CREDENTIALS, request, {
      page,
      perPage,
      total: paginator.total,
    })
    return response.ok({
      credentials: paginator.all().map((c) => ({
        ...toDto(c),
        user: c.user
          ? {
              id: c.user.id,
              nombre: c.user.nombre,
              apellido: c.user.apellido,
              email: c.user.email,
            }
          : undefined,
      })),
      meta: paginationMeta(paginator),
    })
  }

  async store({ request, response, jwtUser }: HttpContext) {
    const data = await request.validateUsing(storeCredentialValidator)

    let targetUserId = jwtUser!.id
    if (data.userId !== undefined) {
      if (jwtUser!.role !== 'SUPERADMIN') {
        return response.forbidden({ message: 'No puedes asignar credenciales a otro usuario' })
      }
      const target = await User.find(data.userId)
      if (!target) {
        return response.badRequest({ message: 'Usuario destino no encontrado' })
      }
      targetUserId = target.id
    }

    const owner = await User.findOrFail(targetUserId)
    const encrypted = encrypt(data.password)

    const credential = await Credential.create({
      userId: targetUserId,
      companyId: owner.companyId,
      servicio: data.servicio,
      username: data.username,
      passwordEncrypted: encrypted,
      url: data.url ?? null,
      notas: data.notas ?? null,
    })

    await credential.load('user')
    await LoggerService.log(jwtUser!.id, AuditAction.CREATE_CREDENTIAL, request, {
      credentialId: credential.id,
      targetUserId: targetUserId,
    })
    return response.created({
      credential: {
        ...toDto(credential),
        user: credential.user
          ? {
              id: credential.user.id,
              nombre: credential.user.nombre,
              apellido: credential.user.apellido,
              email: credential.user.email,
            }
          : undefined,
      },
    })
  }

  async update({ request, response, params, jwtUser }: HttpContext) {
    const id = Number(params.id)
    const credential = await Credential.find(id)
    if (!credential) {
      return response.notFound({ message: 'Credencial no encontrada' })
    }

    if (jwtUser!.role !== 'SUPERADMIN' && credential.userId !== jwtUser!.id) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const data = await request.validateUsing(updateCredentialValidator)

    if (data.servicio !== undefined) credential.servicio = data.servicio
    if (data.username !== undefined) credential.username = data.username
    if (data.url !== undefined) credential.url = data.url
    if (data.notas !== undefined) credential.notas = data.notas
    if (data.password !== undefined) {
      credential.passwordEncrypted = encrypt(data.password)
    }

    await credential.save()
    await LoggerService.log(jwtUser!.id, AuditAction.UPDATE_CREDENTIAL, request, {
      credentialId: id,
    })
    return response.ok({ credential: toDto(credential) })
  }

  async destroy({ response, params, jwtUser, request }: HttpContext) {
    const id = Number(params.id)
    const credential = await Credential.find(id)
    if (!credential) {
      return response.notFound({ message: 'Credencial no encontrada' })
    }

    if (jwtUser!.role !== 'SUPERADMIN' && credential.userId !== jwtUser!.id) {
      return response.forbidden({ message: 'No autorizado' })
    }

    await credential.delete()
    await LoggerService.log(jwtUser!.id, AuditAction.DELETE_CREDENTIAL, request, {
      credentialId: id,
    })
    return response.ok({ message: 'Credencial eliminada' })
  }
}
