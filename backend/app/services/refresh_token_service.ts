import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import RefreshToken from '#models/refresh_token'
import env from '#start/env'

function ttlDays(): number {
  const n = env.get('REFRESH_TOKEN_TTL_DAYS')
  return typeof n === 'number' && n > 0 ? n : 30
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

function generateRaw(): string {
  return randomBytes(48).toString('base64url')
}

export default class RefreshTokenService {
  static async revokeAllForUser(userId: number) {
    await RefreshToken.query().where('user_id', userId).delete()
  }

  static async revokeByRaw(raw: string): Promise<boolean> {
    const row = await RefreshToken.query().where('token_hash', hashRefreshToken(raw)).first()
    if (!row) {
      return false
    }
    await row.delete()
    return true
  }

  /**
   * Crea un refresh token nuevo. El valor en claro solo se devuelve una vez.
   */
  static async issueForUser(userId: number): Promise<{ raw: string }> {
    const raw = generateRaw()
    const tokenHash = hashRefreshToken(raw)
    const expiresAt = DateTime.utc().plus({ days: ttlDays() })
    await RefreshToken.create({
      userId,
      tokenHash,
      expiresAt,
    })
    return { raw }
  }

  /**
   * Valida el refresh token, lo consume (elimina) y devuelve el user_id si es válido.
   */
  static async consume(raw: string): Promise<number | null> {
    const tokenHash = hashRefreshToken(raw)
    const row = await RefreshToken.query().where('token_hash', tokenHash).first()
    if (!row) {
      return null
    }
    if (row.expiresAt < DateTime.utc()) {
      await row.delete()
      return null
    }
    const userId = row.userId
    await row.delete()
    return userId
  }
}
