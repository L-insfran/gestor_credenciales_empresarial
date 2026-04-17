import AccessLog from '#models/access_log'
import { clientIp, clientUserAgent } from '#helpers/request_meta'
import type { HttpContext } from '@adonisjs/core/http'

export default class LoggerService {
  /**
   * Registra un evento de auditoría (no bloquea la respuesta HTTP si falla el insert).
   */
  static async log(
    userId: number | null,
    action: string,
    request: HttpContext['request'],
    metadata?: Record<string, unknown> | null
  ) {
    try {
      await AccessLog.create({
        userId,
        action,
        ipAddress: clientIp(request),
        userAgent: clientUserAgent(request),
        metadata: metadata ?? null,
      })
    } catch (err) {
      console.error('[LoggerService]', err)
    }
  }
}
