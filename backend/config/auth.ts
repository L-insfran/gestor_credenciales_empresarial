import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
import type { InferAuthEvents, InferAuthenticators, Authenticators } from '@adonisjs/auth/types'

/**
 * Autenticación de la API vía JWT (middleware propio). El guard `web` se mantiene
 * para compatibilidad con el stack de sesión de Adonis (middleware global).
 */
const authConfig = defineConfig({
  default: 'web',
  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig

declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
