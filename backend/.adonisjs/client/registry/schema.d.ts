/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.login': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.login_totp': {
    methods: ["POST"]
    pattern: '/login/totp'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginTotpValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginTotpValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['loginTotp']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['loginTotp']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.refresh': {
    methods: ["POST"]
    pattern: '/refresh-token'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').refreshTokenBodyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').refreshTokenBodyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['refresh']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['refresh']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
    }
  }
  'auth.update_profile': {
    methods: ["PUT"]
    pattern: '/me'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updateProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updateProfile']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').logoutBodyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').logoutBodyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'two_factor.enable': {
    methods: ["POST"]
    pattern: '/2fa/enable'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['enable']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['enable']>>>
    }
  }
  'two_factor.verify': {
    methods: ["POST"]
    pattern: '/2fa/verify'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').totpCodeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').totpCodeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['verify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['verify']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'two_factor.disable': {
    methods: ["POST"]
    pattern: '/2fa/disable'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').disable2faValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').disable2faValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['disable']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/two_factor_controller').default['disable']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'logs.index': {
    methods: ["GET","HEAD"]
    pattern: '/logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/logs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/logs_controller').default['index']>>>
    }
  }
  'users.index': {
    methods: ["GET","HEAD"]
    pattern: '/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['index']>>>
    }
  }
  'users.store': {
    methods: ["POST"]
    pattern: '/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').storeUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').storeUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.update': {
    methods: ["PUT"]
    pattern: '/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.destroy': {
    methods: ["DELETE"]
    pattern: '/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['destroy']>>>
    }
  }
  'users.credentials': {
    methods: ["GET","HEAD"]
    pattern: '/users/:userId/credentials'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { userId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['credentials']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['credentials']>>>
    }
  }
  'credentials.index': {
    methods: ["GET","HEAD"]
    pattern: '/credentials'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['index']>>>
    }
  }
  'credentials.store': {
    methods: ["POST"]
    pattern: '/credentials'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/credential').storeCredentialValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/credential').storeCredentialValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'credentials.update': {
    methods: ["PUT"]
    pattern: '/credentials/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/credential').updateCredentialValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/credential').updateCredentialValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'credentials.destroy': {
    methods: ["DELETE"]
    pattern: '/credentials/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credentials_controller').default['destroy']>>>
    }
  }
  'users.lookup': {
    methods: ["GET","HEAD"]
    pattern: '/users/lookup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['lookup']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['lookup']>>>
    }
  }
  'equipos.index': {
    methods: ["GET","HEAD"]
    pattern: '/equipos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['index']>>>
    }
  }
  'equipos.store': {
    methods: ["POST"]
    pattern: '/equipos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/equipo').storeEquipoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/equipo').storeEquipoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'equipos.show': {
    methods: ["GET","HEAD"]
    pattern: '/equipos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['show']>>>
    }
  }
  'equipos.update': {
    methods: ["PUT"]
    pattern: '/equipos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/equipo').updateEquipoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/equipo').updateEquipoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'equipos.destroy': {
    methods: ["DELETE"]
    pattern: '/equipos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipos_controller').default['destroy']>>>
    }
  }
  'equipo_access.index': {
    methods: ["GET","HEAD"]
    pattern: '/equipos/:id/accesos'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipo_access_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipo_access_controller').default['index']>>>
    }
  }
  'equipo_access.store': {
    methods: ["POST"]
    pattern: '/equipos/:id/accesos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/equipo_access').grantEquipoAccessValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/equipo_access').grantEquipoAccessValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipo_access_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipo_access_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'equipo_access.destroy': {
    methods: ["DELETE"]
    pattern: '/equipos/:id/accesos/:userId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; userId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipo_access_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipo_access_controller').default['destroy']>>>
    }
  }
  'equipo_credentials.index': {
    methods: ["GET","HEAD"]
    pattern: '/equipos/:id/credenciales'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['index']>>>
    }
  }
  'equipo_credentials.store': {
    methods: ["POST"]
    pattern: '/equipos/:id/credenciales'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/equipo_credential').storeEquipoCredentialValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/equipo_credential').storeEquipoCredentialValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'equipo_credentials.update': {
    methods: ["PUT"]
    pattern: '/equipos/:id/credenciales/:credId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/equipo_credential').updateEquipoCredentialValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; credId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/equipo_credential').updateEquipoCredentialValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'equipo_credentials.destroy': {
    methods: ["DELETE"]
    pattern: '/equipos/:id/credenciales/:credId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; credId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/equipo_credentials_controller').default['destroy']>>>
    }
  }
  'credential_migration.create_equipo_from_credential': {
    methods: ["POST"]
    pattern: '/migrations/credential-to-equipo'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/credential_to_equipo').createEquipoFromCredentialValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/credential_to_equipo').createEquipoFromCredentialValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/credential_migration_controller').default['createEquipoFromCredential']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/credential_migration_controller').default['createEquipoFromCredential']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
