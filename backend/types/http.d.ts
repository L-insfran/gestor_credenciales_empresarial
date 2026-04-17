import type User from '#models/user'

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    /** Usuario autenticado por JWT (middleware `jwt_auth_middleware`) */
    jwtUser?: User
  }
}
