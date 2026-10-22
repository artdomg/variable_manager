import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'

/**
 * Accepts a 32-byte key encoded as 64 hex characters or as base64.
 * Generate one with: `openssl rand -base64 32`
 */
export function parseEncryptionKey(secret: string | undefined): Buffer {
  if (!secret) throw new Error('ENCRYPTION_KEY no está definida')
  const trimmed = secret.trim()
  const key = /^[0-9a-f]{64}$/i.test(trimmed) ? Buffer.from(trimmed, 'hex') : Buffer.from(trimmed, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY debe tener 32 bytes (64 hex o base64)')
  return key
}

/**
 * Encrypts with AES-256-GCM. `context` is bound as additional authenticated
 * data, so a ciphertext copied to another row fails to decrypt.
 * Output: `v1.<iv>.<tag>.<ciphertext>` (base64url).
 */
export function encrypt(plaintext: string, key: Buffer, context: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  cipher.setAAD(Buffer.from(context, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.')
}

export function decrypt(payload: string, key: Buffer, context: string): string {
  const [version, iv, tag, ciphertext] = payload.split('.')
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
    throw new Error('Formato de valor cifrado no reconocido')
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64url'))
  decipher.setAAD(Buffer.from(context, 'utf8'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
}
