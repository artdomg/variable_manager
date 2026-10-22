import { describe, expect, it } from 'vitest'
import { entriesToJson, parseEnv, parseJsonEnv, serializeEnv } from './env'

describe('parseEnv', () => {
  it('parses quoted, unquoted, exported and commented lines', () => {
    const { entries, errors } = parseEnv(
      [
        '# comment',
        'A=plain # trailing',
        'export B="with \\"quotes\\" and \\n newline"',
        "C='literal ${{x.Y}}'",
        '',
        'D="multi',
        'line"',
        'E=',
      ].join('\n'),
    )
    expect(errors).toEqual([])
    expect(entries).toEqual([
      { key: 'A', value: 'plain' },
      { key: 'B', value: 'with "quotes" and \n newline' },
      { key: 'C', value: 'literal ${{x.Y}}' },
      { key: 'D', value: 'multi\nline' },
      { key: 'E', value: '' },
    ])
  })

  it('reports invalid keys, missing = and duplicates', () => {
    const { errors } = parseEnv('1BAD=x\nNOEQUALS\nA=1\nA=2\nQ="open')
    expect(errors.map((e) => e.line)).toEqual([1, 2, 4, 5])
  })

  it('round-trips through serializeEnv', () => {
    const entries = [
      { key: 'URL', value: 'postgres://u:p@h/db?x="1"' },
      { key: 'PEM', value: 'line1\nline2\\end' },
    ]
    expect(parseEnv(serializeEnv(entries)).entries).toEqual(entries)
  })
})

describe('json', () => {
  it('round-trips and coerces primitives', () => {
    const entries = [{ key: 'A', value: '1' }]
    expect(parseJsonEnv(entriesToJson(entries)).entries).toEqual(entries)
    expect(parseJsonEnv('{"N": 3, "B": true}').entries).toEqual([
      { key: 'N', value: '3' },
      { key: 'B', value: 'true' },
    ])
  })

  it('rejects arrays and nested values', () => {
    expect(parseJsonEnv('[]').errors).toHaveLength(1)
    expect(parseJsonEnv('{"A": {"b": 1}}').errors).toHaveLength(1)
  })
})
