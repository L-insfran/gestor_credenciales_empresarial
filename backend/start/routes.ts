/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const CredentialsController = () => import('#controllers/credentials_controller')
const LogsController = () => import('#controllers/logs_controller')
const TwoFactorController = () => import('#controllers/two_factor_controller')
const EquiposController = () => import('#controllers/equipos_controller')
const EquipoAccessController = () => import('#controllers/equipo_access_controller')
const EquipoCredentialsController = () => import('#controllers/equipo_credentials_controller')
const CredentialMigrationController = () => import('#controllers/credential_migration_controller')

router.get('/health', () => ({ status: 'ok' }))

router.post('/login', [AuthController, 'login'])
router.post('/login/totp', [AuthController, 'loginTotp'])
router.post('/refresh-token', [AuthController, 'refresh'])

router
  .group(() => {
    router.get('/me', [AuthController, 'me'])
    router.put('/me', [AuthController, 'updateProfile'])
    router.post('/logout', [AuthController, 'logout'])
    router.post('/2fa/enable', [TwoFactorController, 'enable'])
    router.post('/2fa/verify', [TwoFactorController, 'verify'])
    router.post('/2fa/disable', [TwoFactorController, 'disable'])
  })
  .use(middleware.jwtAuth())

router
  .group(() => {
    router.get('/logs', [LogsController, 'index'])
    router.get('/users', [UsersController, 'index'])
    router.post('/users', [UsersController, 'store'])
    router.put('/users/:id', [UsersController, 'update'])
    router.delete('/users/:id', [UsersController, 'destroy'])
    router.get('/users/:userId/credentials', [UsersController, 'credentials'])
  })
  .use([middleware.jwtAuth(), middleware.superadmin()])

router
  .group(() => {
    router.get('/credentials', [CredentialsController, 'index'])
    router.post('/credentials', [CredentialsController, 'store'])
    router.put('/credentials/:id', [CredentialsController, 'update'])
    router.delete('/credentials/:id', [CredentialsController, 'destroy'])
  })
  .use([middleware.jwtAuth()])

router
  .group(() => {
    /** Lista compacta de usuarios (selects). Cualquier usuario autenticado: necesario para asignar accesos a equipos. */
    router.get('/users/lookup', [UsersController, 'lookup'])

    router.get('/equipos', [EquiposController, 'index'])
    router.post('/equipos', [EquiposController, 'store'])
    router.get('/equipos/:id', [EquiposController, 'show'])
    router.put('/equipos/:id', [EquiposController, 'update'])
    router.delete('/equipos/:id', [EquiposController, 'destroy'])

    router.get('/equipos/:id/accesos', [EquipoAccessController, 'index'])
    router.post('/equipos/:id/accesos', [EquipoAccessController, 'store'])
    router.delete('/equipos/:id/accesos/:userId', [EquipoAccessController, 'destroy'])

    router.get('/equipos/:id/credenciales', [EquipoCredentialsController, 'index'])
    router.post('/equipos/:id/credenciales', [EquipoCredentialsController, 'store'])
    router.put('/equipos/:id/credenciales/:credId', [EquipoCredentialsController, 'update'])
    router.delete('/equipos/:id/credenciales/:credId', [EquipoCredentialsController, 'destroy'])

    router.post('/migrations/credential-to-equipo', [
      CredentialMigrationController,
      'createEquipoFromCredential',
    ])
  })
  .use([middleware.jwtAuth()])

// Proteger importación masiva: SOLO SUPERADMIN
router
  .post('/equipos/:id/credenciales/import', [EquipoCredentialsController, 'importExcel'])
  .use([middleware.jwtAuth(), middleware.superadmin()])
