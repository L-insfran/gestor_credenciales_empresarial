import type { HttpContext } from '@adonisjs/core/http'
import Credential from '#models/credential'
import Equipo from '#models/equipo'
import EquipoAccess from '#models/equipo_access'
import EquipoCredential from '#models/equipo_credential'
import { createEquipoFromCredentialValidator } from '#validators/credential_to_equipo'
import { AuditAction } from '#constants/audit_actions'
import LoggerService from '#services/logger_service'

/**
 * Herramientas de migración asistida (solo SUPERADMIN).
 * No elimina la credencial original para evitar pérdida accidental; la marca en metadata/auditoría.
 */
export default class CredentialMigrationController {
  async createEquipoFromCredential({ request, response, jwtUser }: HttpContext) {
    if (jwtUser!.role !== 'SUPERADMIN') {
      return response.forbidden({ message: 'Se requiere rol SUPERADMIN' })
    }

    const data = await request.validateUsing(createEquipoFromCredentialValidator)
    const cred = await Credential.query().where('id', data.credentialId).first()
    if (!cred) return response.notFound({ message: 'Credencial no encontrada' })

    const equipo = await Equipo.create({
      ownerUserId: cred.userId,
      nombre: data.nombre ?? cred.servicio,
      tipo: data.tipo ?? 'OTRO',
      detalles: (data.detalles as any) ?? {},
      isPrivate: true,
    })

    await EquipoAccess.firstOrCreate(
      { equipoId: equipo.id, userId: cred.userId },
      { accessLevel: 'EDIT' }
    )

    const equipoCred = await EquipoCredential.create({
      equipoId: equipo.id,
      targetUserId: cred.userId,
      username: cred.username,
      passwordEncrypted: cred.passwordEncrypted,
      url: cred.url,
      notas: cred.notas,
    })

    await LoggerService.log(jwtUser!.id, AuditAction.MIGRATION_CREDENTIAL_TO_EQUIPO, request, {
      source: 'migration_create_equipo_from_credential',
      credentialId: cred.id,
      equipoId: equipo.id,
      equipoCredentialId: equipoCred.id,
      targetUserId: cred.userId,
    })

    return response.created({
      equipo: {
        id: equipo.id,
        ownerUserId: equipo.ownerUserId,
        nombre: equipo.nombre,
        tipo: equipo.tipo,
        detalles: equipo.detalles,
        isPrivate: equipo.isPrivate,
        createdAt: equipo.createdAt,
        updatedAt: equipo.updatedAt,
      },
      equipoCredentialId: equipoCred.id,
    })
  }
}

