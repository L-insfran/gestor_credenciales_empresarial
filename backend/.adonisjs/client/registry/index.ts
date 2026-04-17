/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.login': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.login_totp': {
    methods: ["POST"],
    pattern: '/login/totp',
    tokens: [{"old":"/login/totp","type":0,"val":"login","end":""},{"old":"/login/totp","type":0,"val":"totp","end":""}],
    types: placeholder as Registry['auth.login_totp']['types'],
  },
  'auth.refresh': {
    methods: ["POST"],
    pattern: '/refresh-token',
    tokens: [{"old":"/refresh-token","type":0,"val":"refresh-token","end":""}],
    types: placeholder as Registry['auth.refresh']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/me',
    tokens: [{"old":"/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'auth.update_profile': {
    methods: ["PUT"],
    pattern: '/me',
    tokens: [{"old":"/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.update_profile']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'two_factor.enable': {
    methods: ["POST"],
    pattern: '/2fa/enable',
    tokens: [{"old":"/2fa/enable","type":0,"val":"2fa","end":""},{"old":"/2fa/enable","type":0,"val":"enable","end":""}],
    types: placeholder as Registry['two_factor.enable']['types'],
  },
  'two_factor.verify': {
    methods: ["POST"],
    pattern: '/2fa/verify',
    tokens: [{"old":"/2fa/verify","type":0,"val":"2fa","end":""},{"old":"/2fa/verify","type":0,"val":"verify","end":""}],
    types: placeholder as Registry['two_factor.verify']['types'],
  },
  'two_factor.disable': {
    methods: ["POST"],
    pattern: '/2fa/disable',
    tokens: [{"old":"/2fa/disable","type":0,"val":"2fa","end":""},{"old":"/2fa/disable","type":0,"val":"disable","end":""}],
    types: placeholder as Registry['two_factor.disable']['types'],
  },
  'logs.index': {
    methods: ["GET","HEAD"],
    pattern: '/logs',
    tokens: [{"old":"/logs","type":0,"val":"logs","end":""}],
    types: placeholder as Registry['logs.index']['types'],
  },
  'users.index': {
    methods: ["GET","HEAD"],
    pattern: '/users',
    tokens: [{"old":"/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.index']['types'],
  },
  'users.lookup': {
    methods: ["GET","HEAD"],
    pattern: '/users/lookup',
    tokens: [{"old":"/users/lookup","type":0,"val":"users","end":""},{"old":"/users/lookup","type":0,"val":"lookup","end":""}],
    types: placeholder as Registry['users.lookup']['types'],
  },
  'users.store': {
    methods: ["POST"],
    pattern: '/users',
    tokens: [{"old":"/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['users.store']['types'],
  },
  'users.update': {
    methods: ["PUT"],
    pattern: '/users/:id',
    tokens: [{"old":"/users/:id","type":0,"val":"users","end":""},{"old":"/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.update']['types'],
  },
  'users.destroy': {
    methods: ["DELETE"],
    pattern: '/users/:id',
    tokens: [{"old":"/users/:id","type":0,"val":"users","end":""},{"old":"/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.destroy']['types'],
  },
  'users.credentials': {
    methods: ["GET","HEAD"],
    pattern: '/users/:userId/credentials',
    tokens: [{"old":"/users/:userId/credentials","type":0,"val":"users","end":""},{"old":"/users/:userId/credentials","type":1,"val":"userId","end":""},{"old":"/users/:userId/credentials","type":0,"val":"credentials","end":""}],
    types: placeholder as Registry['users.credentials']['types'],
  },
  'credentials.index': {
    methods: ["GET","HEAD"],
    pattern: '/credentials',
    tokens: [{"old":"/credentials","type":0,"val":"credentials","end":""}],
    types: placeholder as Registry['credentials.index']['types'],
  },
  'credentials.store': {
    methods: ["POST"],
    pattern: '/credentials',
    tokens: [{"old":"/credentials","type":0,"val":"credentials","end":""}],
    types: placeholder as Registry['credentials.store']['types'],
  },
  'credentials.update': {
    methods: ["PUT"],
    pattern: '/credentials/:id',
    tokens: [{"old":"/credentials/:id","type":0,"val":"credentials","end":""},{"old":"/credentials/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['credentials.update']['types'],
  },
  'credentials.destroy': {
    methods: ["DELETE"],
    pattern: '/credentials/:id',
    tokens: [{"old":"/credentials/:id","type":0,"val":"credentials","end":""},{"old":"/credentials/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['credentials.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
