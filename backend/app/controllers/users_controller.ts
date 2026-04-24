import User from '#models/user'
import Credential from '#models/credential'
import { storeUserValidator, updateUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { decrypt } from '#services/encryption_service'
import { parsePagination, paginationMeta } from '#helpers/pagination'
import LoggerService from '#services/logger_service'
import { AuditAction } from '#constants/audit_actions'

function publicUser(user: User) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    role: user.role,
    activo: user.activo,
    companyId: user.companyId,
    initials: user.initials,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

const USER_LIST_SORT_COLUMNS = ['nombre', 'apellido', 'email', 'role', 'activo'] as const
type UserListSortColumn = (typeof USER_LIST_SORT_COLUMNS)[number]

/** Escapa `%`, `_` y `\` para usar en ILIKE … ESCAPE '\\'. */
function escapeLikeFragment(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export default class UsersController {
  /**
   * Listado paginado para la tabla de administración.
   */
  async index({ request, response }: HttpContext) {
    const { page, perPage } = parsePagination(request)
    const nombre = String(request.input('nombre', '')).trim()
    const apellido = String(request.input('apellido', '')).trim()
    const sortByInput = String(request.input('sortBy', 'nombre'))
    const sortOrderInput = String(request.input('sortOrder', 'asc')).toLowerCase()

    const sortBy: UserListSortColumn = USER_LIST_SORT_COLUMNS.includes(
      sortByInput as UserListSortColumn
    )
      ? (sortByInput as UserListSortColumn)
      : 'nombre'
    const sortOrder = sortOrderInput === 'desc' ? 'desc' : 'asc'

    let query = User.query()
    if (nombre) {
      const pattern = `%${escapeLikeFragment(nombre)}%`
      query = query.whereRaw(`nombre ILIKE ? ESCAPE '\\'`, [pattern])
    }
    if (apellido) {
      const pattern = `%${escapeLikeFragment(apellido)}%`
      query = query.whereRaw(`apellido ILIKE ? ESCAPE '\\'`, [pattern])
    }
    query = query.orderBy(sortBy, sortOrder).orderBy('id', 'asc')

    const paginator = await query.paginate(page, perPage)
    return response.ok({
      users: paginator.all().map(publicUser),
      meta: paginationMeta(paginator),
    })
  }

  /**
   * Listado compacto para selects (formularios), sin paginar.
   */
  async lookup({ response }: HttpContext) {
    const rows = await User.query()
      .where('activo', true)
      .select('id', 'nombre', 'apellido', 'email')
      .orderBy('id', 'asc')
    return response.ok({
      users: rows.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
      })),
    })
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(storeUserValidator)
    const user = await User.create({
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      password: data.password,
      role: data.role,
      activo: data.activo !== false,
      companyId: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
    })
    return response.created({ user: publicUser(user) })
  }

  async update({ request, response, params, jwtUser }: HttpContext) {
    const id = Number(params.id)
    const user = await User.find(id)
    if (!user) {
      return response.notFound({ message: 'Usuario no encontrado' })
    }

    const data = await request.validateUsing(updateUserValidator)

    if (data.activo === false && id === jwtUser!.id) {
      return response.badRequest({ message: 'No podés deshabilitar tu propia cuenta' })
    }

    if (data.email && data.email !== user.email) {
      const taken = await User.query().where('email', data.email).whereNot('id', user.id).first()
      if (taken) {
        return response.conflict({ message: 'El email ya está en uso' })
      }
      user.email = data.email
    }
    if (data.nombre !== undefined) user.nombre = data.nombre
    if (data.apellido !== undefined) user.apellido = data.apellido
    if (data.role !== undefined) user.role = data.role
    if (data.companyId !== undefined) user.companyId = data.companyId
    if (data.password) user.password = data.password
    if (data.activo !== undefined) user.activo = data.activo

    await user.save()
    return response.ok({ user: publicUser(user) })
  }

  async destroy({ response, params, jwtUser }: HttpContext) {
    const id = Number(params.id)
    if (id === jwtUser!.id) {
      return response.badRequest({ message: 'No puedes eliminar tu propia cuenta' })
    }
    const user = await User.find(id)
    if (!user) {
      return response.notFound({ message: 'Usuario no encontrado' })
    }
    await user.delete()
    return response.ok({ message: 'Usuario eliminado' })
  }

  /**
   * Credenciales de un usuario concreto (solo SUPERADMIN).
   */
  async credentials({ response, params, request, jwtUser }: HttpContext) {
    const userId = Number(params.userId)
    const owner = await User.find(userId)
    if (!owner) {
      return response.notFound({ message: 'Usuario no encontrado' })
    }

    const rows = await Credential.query().where('user_id', userId).orderBy('created_at', 'desc')

    const credentials = rows.map((c) => ({
      id: c.id,
      userId: c.userId,
      servicio: c.servicio,
      username: c.username,
      password: decrypt(c.passwordEncrypted),
      url: c.url,
      notas: c.notas,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    await LoggerService.log(jwtUser!.id, AuditAction.VIEW_CREDENTIALS, request, {
      targetUserId: userId,
      count: credentials.length,
      source: 'admin_user_credentials',
    })

    return response.ok({ user: publicUser(owner), credentials })
  }
}
