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
    router.get('/users/lookup', [UsersController, 'lookup'])
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
