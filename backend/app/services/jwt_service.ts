import jwt, { type SignOptions } from 'jsonwebtoken'
import env from '#start/env'

export type AppJwtPayload = {
  typ: 'access'
  sub: number
  role: 'USER' | 'SUPERADMIN'
}

export type Pending2faJwtPayload = {
  typ: '2fa_pending'
  sub: number
}

function accessExpiresIn(): SignOptions['expiresIn'] {
  const v = env.get('JWT_ACCESS_EXPIRES')
  return (v && String(v).length ? String(v) : '15m') as SignOptions['expiresIn']
}

export function signAccessToken(payload: { sub: number; role: 'USER' | 'SUPERADMIN' }): string {
  const opts: SignOptions = { expiresIn: accessExpiresIn() }
  return jwt.sign(
    { typ: 'access', sub: payload.sub, role: payload.role },
    env.get('JWT_SECRET'),
    opts
  )
}

export function signTwoFactorPendingToken(userId: number): string {
  const opts: SignOptions = { expiresIn: '5m' }
  return jwt.sign({ typ: '2fa_pending', sub: userId }, env.get('JWT_SECRET'), opts)
}

export function verifyAccessToken(token: string): AppJwtPayload {
  const decoded = jwt.verify(token, env.get('JWT_SECRET'))
  if (typeof decoded !== 'object' || decoded === null) {
    throw new jwt.JsonWebTokenError('Token inválido')
  }
  const obj = decoded as jwt.JwtPayload & { typ?: string; role?: string; sub?: unknown }
  if (obj.typ !== 'access') {
    throw new jwt.JsonWebTokenError('Token inválido')
  }
  const sub = obj.sub
  if (sub === undefined || sub === null) {
    throw new jwt.JsonWebTokenError('Token inválido')
  }
  const role = obj.role
  if (role !== 'USER' && role !== 'SUPERADMIN') {
    throw new jwt.JsonWebTokenError('Rol inválido')
  }
  return {
    typ: 'access',
    sub: typeof sub === 'string' ? Number(sub) : sub,
    role,
  }
}

export function verifyTwoFactorPendingToken(token: string): Pending2faJwtPayload {
  const decoded = jwt.verify(token, env.get('JWT_SECRET'))
  if (typeof decoded !== 'object' || decoded === null) {
    throw new jwt.JsonWebTokenError('Token inválido')
  }
  const obj = decoded as jwt.JwtPayload & { typ?: string; sub?: unknown }
  if (obj.typ !== '2fa_pending') {
    throw new jwt.JsonWebTokenError('Token inválido')
  }
  const sub = obj.sub
  if (sub === undefined || sub === null) {
    throw new jwt.JsonWebTokenError('Token inválido')
  }
  return {
    typ: '2fa_pending',
    sub: typeof sub === 'string' ? Number(sub) : sub,
  }
}
