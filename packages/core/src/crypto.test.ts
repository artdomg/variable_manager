import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decrypt, encrypt, parseEncryptionKey } from './crypto'

describe('crypto', () => {
  const key = parseEncryptionKey(randomBytes(32).toString('base64'))

  it('round-trips and uses a fresh IV each time', () => {
    const a = encrypt('s3cret ✓', key, 'entity-1')
    expect(a).not.toBe(encrypt('s3cret ✓', key, 'entity-1'))
    expect(decrypt(a, key, 'entity-1')).toBe('s3cret ✓')
  })

  it('fails with the wrong context or a tampered payload', () => {
    const payload = encrypt('value', key, 'entity-1')
    expect(() => decrypt(payload, key, 'entity-2')).toThrow()
    expect(() => decrypt(payload.slice(0, -2) + 'AA', key, 'entity-1')).toThrow()
  })

  it('validates key length', () => {
    expect(() => parseEncryptionKey('short')).toThrow()
    expect(parseEncryptionKey('ab'.repeat(32))).toHaveLength(32)
  })
})
