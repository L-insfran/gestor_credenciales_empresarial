import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'
import { verifyAccessToken, type AppJwtPayload } from '#services/jwt_service'

export default class JwtAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const header = ctx.request.header('authorization')
    const raw = header?.replace(/^Bearer\s+/i, '').trim()
    if (!raw) {
      return ctx.response.unauthorized({ message: 'Token no proporcionado' })
    }

    let payload: AppJwtPayload
    try {
      payload = verifyAccessToken(raw)
    } catch {
      return ctx.response.unauthorized({ message: 'Token inválido o expirado' })
    }

    const user = await User.find(payload.sub)
    if (!user || user.role !== payload.role) {
      return ctx.response.unauthorized({ message: 'Usuario no válido' })
    }

    if (!user.activo) {
      return ctx.response.unauthorized({ message: 'Tu cuenta está deshabilitada. Contactá al administrador.' })
    }

    ctx.jwtUser = user
    return next()
  }
}
