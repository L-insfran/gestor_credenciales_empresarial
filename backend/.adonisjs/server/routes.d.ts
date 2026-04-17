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
    'users.lookup': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.credentials': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'credentials.index': { paramsTuple?: []; params?: {} }
    'credentials.store': { paramsTuple?: []; params?: {} }
    'credentials.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credentials.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'logs.index': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.lookup': { paramsTuple?: []; params?: {} }
    'users.credentials': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'credentials.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'logs.index': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.lookup': { paramsTuple?: []; params?: {} }
    'users.credentials': { paramsTuple: [ParamValue]; params: {'userId': ParamValue} }
    'credentials.index': { paramsTuple?: []; params?: {} }
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
  }
  PUT: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credentials.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'credentials.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}