import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.login_totp': { paramsTuple?: []; params?: {} }
    'auth.refresh': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'two_factor.enable': { paramsTuple?: []; params?: {} }
    'two_factor.verify': { paramsTuple?: []; params?: {} }
    'two_factor.disable': { paramsTuple?: []; params?: {} }
    'logs.index': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.credentials': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'credentials.index': { paramsTuple?: []; params?: {} }
    'credentials.store': { paramsTuple?: []; params?: {} }
    'credentials.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credentials.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.lookup': { paramsTuple?: []; params?: {} }
    'equipos.index': { paramsTuple?: []; params?: {} }
    'equipos.store': { paramsTuple?: []; params?: {} }
    'equipos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_access.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_access.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_access.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'equipo_credentials.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_credentials.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_credentials.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'credId': ParamValue} }
    'equipo_credentials.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'credId': ParamValue} }
    'credential_migration.create_equipo_from_credential': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'logs.index': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.credentials': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'credentials.index': { paramsTuple?: []; params?: {} }
    'users.lookup': { paramsTuple?: []; params?: {} }
    'equipos.index': { paramsTuple?: []; params?: {} }
    'equipos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_access.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_credentials.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'logs.index': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.credentials': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'credentials.index': { paramsTuple?: []; params?: {} }
    'users.lookup': { paramsTuple?: []; params?: {} }
    'equipos.index': { paramsTuple?: []; params?: {} }
    'equipos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_access.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_credentials.index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.login_totp': { paramsTuple?: []; params?: {} }
    'auth.refresh': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'two_factor.enable': { paramsTuple?: []; params?: {} }
    'two_factor.verify': { paramsTuple?: []; params?: {} }
    'two_factor.disable': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'credentials.store': { paramsTuple?: []; params?: {} }
    'equipos.store': { paramsTuple?: []; params?: {} }
    'equipo_access.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_credentials.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credential_migration.create_equipo_from_credential': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credentials.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_credentials.update': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'credId': ParamValue} }
  }
  DELETE: {
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credentials.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'equipo_access.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'userId': ParamValue} }
    'equipo_credentials.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'credId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}