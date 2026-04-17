import { DateTime } from 'luxon'
import AccessLog from '#models/access_log'
import type { HttpContext } from '@adonisjs/core/http'
import { parsePagination, paginationMeta } from '#helpers/pagination'

export default class LogsController {
  async index({ request, response }: HttpContext) {
    const { page, perPage } = parsePagination(request)
    const userIdRaw = request.input('userId')
    const action = String(request.input('action', '')).trim()
    const dateFrom = String(request.input('dateFrom', '')).trim()
    const dateTo = String(request.input('dateTo', '')).trim()

    const q = AccessLog.query().preload('user', (uq) => {
      uq.select('id', 'email', 'nombre', 'apellido', 'role')
    })

    if (userIdRaw !== undefined && userIdRaw !== null && userIdRaw !== '') {
      const uid = Number(userIdRaw)
      if (Number.isFinite(uid) && uid > 0) {
        q.where('user_id', uid)
      }
    }

    if (action) {
      q.where('action', action)
    }

    if (dateFrom) {
      const dt = DateTime.fromISO(dateFrom)
      if (dt.isValid) {
        q.where('created_at', '>=', dt.toSQL()!)
      }
    }
    if (dateTo) {
      const dt = DateTime.fromISO(dateTo)
      if (dt.isValid) {
        q.where('created_at', '<=', dt.endOf('day').toSQL()!)
      }
    }

    const paginator = await q.orderBy('created_at', 'desc').paginate(page, perPage)

    return response.ok({
      logs: paginator.all().map((row) => ({
        id: row.id,
        userId: row.userId,
        action: row.action,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        metadata: row.metadata,
        createdAt: row.createdAt,
        user: row.user
          ? {
              id: row.user.id,
              email: row.user.email,
              nombre: row.user.nombre,
              apellido: row.user.apellido,
              role: row.user.role,
            }
          : null,
      })),
      meta: paginationMeta(paginator),
    })
  }
}
