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
    lookup: typeof routes['users.lookup']
    store: typeof routes['users.store']
    update: typeof routes['users.update']
    destroy: typeof routes['users.destroy']
    credentials: typeof routes['users.credentials']
  }
  credentials: {
    index: typeof routes['credentials.index']
    store: typeof routes['credentials.store']
    update: typeof routes['credentials.update']
    destroy: typeof routes['credentials.destroy']
  }
}
