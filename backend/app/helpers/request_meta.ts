import type { HttpContext } from '@adonisjs/core/http'

type AppRequest = HttpContext['request']

/**
 * IP del cliente (delega en la detección del framework; suele respetar proxies si están configurados).
 */
export function clientIp(request: AppRequest): string | null {
  try {
    const ip = request.ip()
    if (ip) {
      return ip.replace(/^::ffff:/, '').slice(0, 45)
    }
  } catch {
    /* ignore */
  }
  return null
}

export function clientUserAgent(request: AppRequest): string | null {
  const ua = request.header('user-agent')
  if (!ua) return null
  return ua.length > 512 ? ua.slice(0, 512) : ua
}
