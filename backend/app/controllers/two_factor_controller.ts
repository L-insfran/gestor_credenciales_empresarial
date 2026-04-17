import User from '#models/user'
import TwoFactorService from '#services/two_factor_service'
import { disable2faValidator, totpCodeValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class TwoFactorController {
  async enable({ jwtUser, response }: HttpContext) {
    const user = await User.findOrFail(jwtUser!.id)
    if (user.twoFactorEnabled) {
      return response.badRequest({ message: 'El 2FA ya está activado' })
    }
    const { qrDataUrl } = await TwoFactorService.startSetup(user)
    return response.ok({ qrDataUrl })
  }

  async verify({ jwtUser, request, response }: HttpContext) {
    const { code } = await request.validateUsing(totpCodeValidator)
    const user = await User.findOrFail(jwtUser!.id)
    if (user.twoFactorEnabled) {
      return response.badRequest({ message: 'El 2FA ya está activado' })
    }
    const ok = await TwoFactorService.confirmSetup(user, code)
    if (!ok) {
      return response.badRequest({ message: 'Código incorrecto o configuración no iniciada' })
    }
    return response.ok({ message: '2FA activado correctamente', twoFactorEnabled: true })
  }

  async disable({ jwtUser, request, response }: HttpContext) {
    const data = await request.validateUsing(disable2faValidator)
    const user = await User.findOrFail(jwtUser!.id)
    const result = await TwoFactorService.disable(user, data.password, data.code)
    if (result === 'bad_password') {
      return response.unauthorized({ message: 'Contraseña incorrecta' })
    }
    if (result === 'totp_required') {
      return response.badRequest({ message: 'Debes enviar el código TOTP para desactivar el 2FA' })
    }
    if (result === 'bad_totp') {
      return response.badRequest({ message: 'Código TOTP incorrecto' })
    }
    return response.ok({ message: '2FA desactivado', twoFactorEnabled: false })
  }
}
