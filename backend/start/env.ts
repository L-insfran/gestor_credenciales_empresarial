/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  JWT_SECRET: Env.schema.string(),
  /** Duración del access token JWT (ej. 15m, 1h). Por defecto 15m. */
  JWT_ACCESS_EXPIRES: Env.schema.string.optional(),
  /** Días de validez del refresh token (por defecto 30). */
  REFRESH_TOKEN_TTL_DAYS: Env.schema.number.optional(),
  /** Clave AES-256: 64 caracteres hexadecimales (32 bytes), p. ej. openssl rand -hex 32 */
  ENCRYPTION_KEY: Env.schema.string(),
})
