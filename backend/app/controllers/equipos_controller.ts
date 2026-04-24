import type { HttpContext } from '@adonisjs/core/http'
import Equipo from '#models/equipo'
import EquipoAccess from '#models/equipo_access'
import { storeEquipoValidator, updateEquipoValidator } from '#validators/equipo'
import { parsePagination, paginationMeta } from '#helpers/pagination'
import LoggerService from '#services/logger_service'
import { AuditAction } from '#constants/audit_actions'
import EquipoAclService from '#services/equipo_acl_service'

/** Escapa `%`, `_` y `\` para usar en ILIKE … ESCAPE '\\'. */
function escapeLikeFragment(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function equipoDto(row: Equipo) {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    nombre: row.nombre,
    tipo: row.tipo,
    detalles: row.detalles ?? {},
    isPrivate: row.isPrivate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export default class EquiposController {
  async index({ request, response, jwtUser }: HttpContext) {
    const { page, perPage } = parsePagination(request)
    const q = Equipo.query()

    const nombre = String(request.input('nombre', '')).trim()
    const tipo = String(request.input('tipo', '')).trim()

    if (nombre) {
      const pattern = `%${escapeLikeFragment(nombre)}%`
      q.whereRaw(`nombre ILIKE ? ESCAPE '\\'`, [pattern])
    }
    if (tipo) {
      q.where('tipo', tipo)
    }

    if (jwtUser!.role !== 'SUPERADMIN') {
      q.where((sub) => {
        sub.where('owner_user_id', jwtUser!.id).orWhereExists((ex) => {
          ex.from('equipo_access')
            .select('id')
            .whereRaw('equipo_access.equipo_id = equipos.id')
            .where('equipo_access.user_id', jwtUser!.id)
        })
      })
    }

    const paginator = await q.orderBy('created_at', 'desc').paginate(page, perPage)

    await LoggerService.log(jwtUser!.id, AuditAction.VIEW_EQUIPOS, request, {
      page,
      perPage,
      total: paginator.total,
    })

    return response.ok({
      equipos: paginator.all().map(equipoDto),
      meta: paginationMeta(paginator),
    })
  }

  async store({ request, response, jwtUser }: HttpContext) {
    const data = await request.validateUsing(storeEquipoValidator)

    const isPrivate =
      jwtUser!.role === 'SUPERADMIN' ? Boolean(data.isPrivate ?? true) : true

    const equipo = await Equipo.create({
      ownerUserId: jwtUser!.id,
      nombre: data.nombre,
      tipo: data.tipo,
      detalles: (data.detalles as any) ?? {},
      isPrivate,
    })

    // El owner tiene acceso implícito; si el equipo es compartible, agregamos un registro explícito en ACL para facilitar queries futuras.
    await EquipoAccess.firstOrCreate(
      { equipoId: equipo.id, userId: jwtUser!.id },
      { accessLevel: 'EDIT' }
    )

    await LoggerService.log(jwtUser!.id, AuditAction.CREATE_EQUIPO, request, {
      equipoId: equipo.id,
    })

    return response.created({ equipo: equipoDto(equipo) })
  }

  async show({ params, response, jwtUser }: HttpContext) {
    const id = Number(params.id)
    const equipo = await Equipo.find(id)
    if (!equipo) {
      return response.notFound({ message: 'Equipo no encontrado' })
    }
    await equipo.load('owner', (q) => q.select('id', 'email', 'nombre', 'apellido'))

    if (jwtUser!.role !== 'SUPERADMIN') {
      const allowed =
        equipo.ownerUserId === jwtUser!.id ||
        Boolean(
          await EquipoAccess.query()
            .select('id')
            .where('equipo_id', equipo.id)
            .where('user_id', jwtUser!.id)
            .first()
        )
      if (!allowed) {
        return response.forbidden({ message: 'No autorizado' })
      }
    }

    const canEdit = await EquipoAclService.canAdmin(jwtUser!, equipo)
    const canManageAssignments =
      jwtUser!.role === 'SUPERADMIN' || equipo.ownerUserId === jwtUser!.id

    return response.ok({
      equipo: {
        ...equipoDto(equipo),
        canEdit,
        canManageAssignments,
        owner: equipo.owner
          ? {
              id: equipo.owner.id,
              email: equipo.owner.email,
              nombre: equipo.owner.nombre,
              apellido: equipo.owner.apellido,
            }
          : null,
      },
    })
  }

  async update({ request, response, params, jwtUser }: HttpContext) {
    const id = Number(params.id)
    const equipo = await Equipo.find(id)
    if (!equipo) {
      return response.notFound({ message: 'Equipo no encontrado' })
    }

    const canEdit =
      jwtUser!.role === 'SUPERADMIN' ||
      equipo.ownerUserId === jwtUser!.id ||
      (await EquipoAccess.query()
        .where('equipo_id', equipo.id)
        .where('user_id', jwtUser!.id)
        .where('access_level', 'EDIT')
        .first())

    if (!canEdit) {
      return response.forbidden({ message: 'No autorizado' })
    }

    const data = await request.validateUsing(updateEquipoValidator)
    if (data.nombre !== undefined) equipo.nombre = data.nombre
    if (data.tipo !== undefined) equipo.tipo = data.tipo
    if (data.detalles !== undefined) equipo.detalles = (data.detalles as any) ?? {}
    if (data.isPrivate !== undefined) {
      if (jwtUser!.role !== 'SUPERADMIN') {
        // Usuarios normales no pueden abrir/cerrar visibilidad global del equipo.
      } else {
        equipo.isPrivate = Boolean(data.isPrivate)
      }
    }

    await equipo.save()
    await LoggerService.log(jwtUser!.id, AuditAction.UPDATE_EQUIPO, request, { equipoId: equipo.id })
    return response.ok({ equipo: equipoDto(equipo) })
  }

  async destroy({ response, params, jwtUser, request }: HttpContext) {
    const id = Number(params.id)
    const equipo = await Equipo.find(id)
    if (!equipo) {
      return response.notFound({ message: 'Equipo no encontrado' })
    }

    if (jwtUser!.role !== 'SUPERADMIN' && equipo.ownerUserId !== jwtUser!.id) {
      return response.forbidden({ message: 'No autorizado' })
    }

    await equipo.delete()
    await LoggerService.log(jwtUser!.id, AuditAction.DELETE_EQUIPO, request, { equipoId: id })
    return response.ok({ message: 'Equipo eliminado' })
  }
}

