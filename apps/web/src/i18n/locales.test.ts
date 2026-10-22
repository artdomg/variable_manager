import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import es from './locales/es.json'

const keys = (node: object, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  )

describe('locales', () => {
  it('es and en define exactly the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(es).sort())
  })
})
