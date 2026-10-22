import { decrypt, encrypt, parseEncryptionKey } from '@vm/core/crypto'

let key: Buffer | undefined
const getKey = () => (key ??= parseEncryptionKey(process.env.ENCRYPTION_KEY))

/** Values are bound to their entity, so a ciphertext moved to another entity won't decrypt. */
export const sealValue = (value: string, entityId: string) => encrypt(value, getKey(), entityId)
export const openValue = (payload: string, entityId: string) => decrypt(payload, getKey(), entityId)
