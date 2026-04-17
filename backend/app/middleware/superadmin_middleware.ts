import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/** Restringe la ruta al rol SUPERADMIN (componible con `jwtAuth`). Para otros roles, duplicar el patrón con la lista deseada. */
export default class SuperadminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.jwtUser?.role !== 'SUPERADMIN') {
      return ctx.response.forbidden({ message: 'Se requiere rol SUPERADMIN' })
    }
    return next()
  }
}
