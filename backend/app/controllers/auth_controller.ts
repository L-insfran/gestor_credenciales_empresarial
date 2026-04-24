import User from '#models/user'
import {
  loginValidator,
  updateProfileValidator,
  loginTotpValidator,
  refreshTokenBodyValidator,
  logoutBodyValidator,
} from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import {
  signAccessToken,
  signTwoFactorPendingToken,
  verifyTwoFactorPendingToken,
} from '#services/jwt_service'
import { errors } from '@adonisjs/auth'
import LoggerService from '#services/logger_service'
import { AuditAction } from '#constants/audit_actions'
import RefreshTokenService from '#services/refresh_token_service'
import TwoFactorService from '#services/two_factor_service'

function authUserDto(user: User) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    role: user.role,
    activo: user.activo,
    companyId: user.companyId,
    initials: user.initials,
    createdAt: user.createdAt,
    twoFactorEnabled: user.twoFactorEnabled,
  }
}

export default class AuthController {
  async me({ response, jwtUser }: HttpContext) {
    const user = jwtUser!
    return response.ok({ user: authUserDto(user) })
  }

  async updateProfile({ request, response, jwtUser }: HttpContext) {
    const sessionUser = jwtUser!
    const user = await User.findOrFail(sessionUser.id)
    const data = await request.validateUsing(updateProfileValidator)

    if (data.email && data.email !== user.email) {
      const taken = await User.query().where('email', data.email).whereNot('id', user.id).first()
      if (taken) {
        return response.conflict({ message: 'El email ya está en uso' })
      }
      user.email = data.email
    }
    if (data.nombre !== undefined) user.nombre = data.nombre
    if (data.apellido !== undefined) user.apellido = data.apellido
    if (data.password) user.password = data.password

    await user.save()

    return response.ok({ user: authUserDto(user) })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      if (errors.E_INVALID_CREDENTIALS.isError(error)) {
        const byEmail = await User.query().where('email', email).first()
        await LoggerService.log(byEmail?.id ?? null, AuditAction.LOGIN_FAILED, request, {
          reason: 'invalid_credentials',
        })
        return response.unauthorized({ message: 'Email o contraseña incorrectos' })
      }
      throw error
    }

    if (!user.activo) {
      await LoggerService.log(user.id, AuditAction.LOGIN_FAILED, request, { reason: 'account_inactive' })
      return response.unauthorized({ message: 'Tu cuenta está deshabilitada. Contactá al administrador.' })
    }

    if (user.twoFactorEnabled) {
      const pendingToken = signTwoFactorPendingToken(user.id)
      return response.ok({
        requiresTwoFactor: true,
        pendingToken,
      })
    }

    await RefreshTokenService.revokeAllForUser(user.id)
    const { raw: issuedRefresh } = await RefreshTokenService.issueForUser(user.id)
    const accessToken = signAccessToken({ sub: user.id, role: user.role })
    await LoggerService.log(user.id, AuditAction.LOGIN, request)

    return response.ok({
      access_token: accessToken,
      refresh_token: issuedRefresh,
      user: authUserDto(user),
    })
  }

  async loginTotp({ request, response }: HttpContext) {
    const { pendingToken, code } = await request.validateUsing(loginTotpValidator)
    let payload
    try {
      payload = verifyTwoFactorPendingToken(pendingToken)
    } catch {
      return response.unauthorized({
        message: 'Verificación expirada o inválida. Iniciá sesión de nuevo.',
      })
    }

    const user = await User.find(payload.sub)
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return response.unauthorized({ message: 'Usuario no válido para 2FA' })
    }

    if (!user.activo) {
      return response.unauthorized({ message: 'Tu cuenta está deshabilitada. Contactá al administrador.' })
    }

    if (!TwoFactorService.verifyForEnabledUser(user, code)) {
      await LoggerService.log(user.id, AuditAction.LOGIN_FAILED, request, {
        reason: 'invalid_totp',
      })
      return response.unauthorized({ message: 'Código de verificación incorrecto' })
    }

    await RefreshTokenService.revokeAllForUser(user.id)
    const { raw: issuedRefreshTotp } = await RefreshTokenService.issueForUser(user.id)
    const accessTokenTotp = signAccessToken({ sub: user.id, role: user.role })
    await LoggerService.log(user.id, AuditAction.LOGIN, request)

    return response.ok({
      access_token: accessTokenTotp,
      refresh_token: issuedRefreshTotp,
      user: authUserDto(user),
    })
  }

  async refresh({ request, response }: HttpContext) {
    const body = await request.validateUsing(refreshTokenBodyValidator)
    const userId = await RefreshTokenService.consume(body.refresh_token)
    if (!userId) {
      return response.unauthorized({ message: 'Refresh token inválido o expirado' })
    }
    const user = await User.find(userId)
    if (!user) {
      return response.unauthorized({ message: 'Usuario no encontrado' })
    }
    if (!user.activo) {
      return response.unauthorized({ message: 'Tu cuenta está deshabilitada. Contactá al administrador.' })
    }
    const { raw: rotatedRefresh } = await RefreshTokenService.issueForUser(user.id)
    const accessTokenRefresh = signAccessToken({ sub: user.id, role: user.role })
    return response.ok({
      access_token: accessTokenRefresh,
      refresh_token: rotatedRefresh,
    })
  }

  async logout({ request, response, jwtUser }: HttpContext) {
    const body = await request.validateUsing(logoutBodyValidator)
    if (body.refresh_token) {
      await RefreshTokenService.revokeByRaw(body.refresh_token)
    } else {
      await RefreshTokenService.revokeAllForUser(jwtUser!.id)
    }
    await LoggerService.log(jwtUser!.id, AuditAction.LOGOUT, request)
    return response.ok({ message: 'Sesión cerrada' })
  }
}
