/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    login: typeof routes['auth.login']
    loginTotp: typeof routes['auth.login_totp']
    refresh: typeof routes['auth.refresh']
    me: typeof routes['auth.me']
    updateProfile: typeof routes['auth.update_profile']
    logout: typeof routes['auth.logout']
  }
  twoFactor: {
    enable: typeof routes['two_factor.enable']
    verify: typeof routes['two_factor.verify']
    disable: typeof routes['two_factor.disable']
  }
  logs: {
    index: typeof routes['logs.index']
  }
  users: {
    index: typeof routes['users.index']
    store: typeof routes['users.store']
    update: typeof routes['users.update']
    destroy: typeof routes['users.destroy']
    credentials: typeof routes['users.credentials']
    lookup: typeof routes['users.lookup']
  }
  credentials: {
    index: typeof routes['credentials.index']
    store: typeof routes['credentials.store']
    update: typeof routes['credentials.update']
    destroy: typeof routes['credentials.destroy']
  }
  equipos: {
    index: typeof routes['equipos.index']
    store: typeof routes['equipos.store']
    show: typeof routes['equipos.show']
    update: typeof routes['equipos.update']
    destroy: typeof routes['equipos.destroy']
  }
  equipoAccess: {
    index: typeof routes['equipo_access.index']
    store: typeof routes['equipo_access.store']
    destroy: typeof routes['equipo_access.destroy']
  }
  equipoCredentials: {
    index: typeof routes['equipo_credentials.index']
    store: typeof routes['equipo_credentials.store']
    update: typeof routes['equipo_credentials.update']
    destroy: typeof routes['equipo_credentials.destroy']
  }
  credentialMigration: {
    createEquipoFromCredential: typeof routes['credential_migration.create_equipo_from_credential']
  }
}
