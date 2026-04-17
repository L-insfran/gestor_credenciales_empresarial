import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import env from '#start/env'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function encryptionKey(): Buffer {
  const hex = env.get('ENCRYPTION_KEY').trim()
  const buf = Buffer.from(hex, 'hex')
  if (buf.length !== 32) {
    throw new Error(
      'ENCRYPTION_KEY debe ser exactamente 64 caracteres hexadecimales (32 bytes para AES-256). Ej: openssl rand -hex 32'
    )
  }
  return buf
}

/**
 * Cifra texto con AES-256-GCM. El resultado es base64(iv || authTag || ciphertext).
 */
export function encrypt(plainText: string): string {
  const key = encryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/**
 * Descifra el payload producido por `encrypt`.
 */
export function decrypt(payload: string): string {
  const key = encryptionKey()
  const buf = Buffer.from(payload, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const data = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
