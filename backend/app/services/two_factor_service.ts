import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import env from '#start/env'
import User from '#models/user'
import { decrypt, encrypt } from '#services/encryption_service'

function totpIssuer(): string {
  try {
    return new URL(env.get('APP_URL')).hostname || 'GestorCredenciales'
  } catch {
    return 'GestorCredenciales'
  }
}

export default class TwoFactorService {
  static verifyCode(secretBase32: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token,
      window: 1,
    })
  }

  /** Valida TOTP contra el secreto cifrado del usuario (login paso 2). */
  static verifyForEnabledUser(user: User, token: string): boolean {
    if (!user.twoFactorSecret) {
      return false
    }
    const base32 = decrypt(user.twoFactorSecret)
    return this.verifyCode(base32, token)
  }

  /**
   * Genera secreto, lo guarda cifrado (2FA aún desactivado) y devuelve solo el QR (sin secret en JSON).
   */
  static async startSetup(user: User): Promise<{ qrDataUrl: string }> {
    const secret = speakeasy.generateSecret({ length: 20 })
    const base32 = secret.base32
    if (!base32) {
      throw new Error('No se pudo generar el secreto TOTP')
    }
    user.twoFactorSecret = encrypt(base32)
    user.twoFactorEnabled = false
    await user.save()

    const issuer = totpIssuer()
    const otpauthUrl = speakeasy.otpauthURL({
      secret: base32,
      label: user.email,
      issuer,
      encoding: 'base32',
    })
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 2, width: 240 })
    return { qrDataUrl }
  }

  static async confirmSetup(user: User, code: string): Promise<boolean> {
    if (!user.twoFactorSecret) {
      return false
    }
    const base32 = decrypt(user.twoFactorSecret)
    if (!this.verifyCode(base32, code)) {
      return false
    }
    user.twoFactorEnabled = true
    await user.save()
    return true
  }

  static async disable(
    user: User,
    password: string,
    totpCode?: string
  ): Promise<'ok' | 'bad_password' | 'totp_required' | 'bad_totp'> {
    try {
      await User.verifyCredentials(user.email, password)
    } catch {
      return 'bad_password'
    }

    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return 'totp_required'
      }
      if (!user.twoFactorSecret) {
        return 'bad_totp'
      }
      const base32 = decrypt(user.twoFactorSecret)
      if (!this.verifyCode(base32, totpCode)) {
        return 'bad_totp'
      }
    }

    user.twoFactorEnabled = false
    user.twoFactorSecret = null
    await user.save()
    return 'ok'
  }
}
