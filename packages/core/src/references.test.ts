import { describe, expect, it } from 'vitest'
import { findReferences, resolveProject } from './references'

const project = (spec: Record<string, Record<string, string>>) =>
  Object.entries(spec).map(([name, vars]) => ({
    name,
    variables: Object.entries(vars).map(([key, value]) => ({ key, value })),
  }))

const valueOf = (result: ReturnType<typeof resolveProject>, entity: string, key: string) =>
  result.get(entity)!.find((v) => v.key === key)!

describe('findReferences', () => {
  it('finds references with optional whitespace', () => {
    expect(findReferences('a ${{db.URL}} b ${{ cache.HOST }}').map((r) => `${r.entity}.${r.key}`)).toEqual([
      'db.URL',
      'cache.HOST',
    ])
  })
})

describe('resolveProject', () => {
  it('substitutes nested references across entities', () => {
    const result = resolveProject(
      project({
        postgres: { HOST: 'db.internal', URL: 'postgres://${{postgres.HOST}}:5432' },
        api: { DATABASE_URL: '${{postgres.URL}}/app', PORT: '8080' },
      }),
    )
    expect(valueOf(result, 'api', 'DATABASE_URL')).toMatchObject({
      value: 'postgres://db.internal:5432/app',
      errors: [],
    })
  })

  it('keeps missing references verbatim and reports them', () => {
    const result = resolveProject(project({ api: { A: '${{nope.X}}', B: '${{api.MISSING}}' } }))
    expect(valueOf(result, 'api', 'A')).toMatchObject({ value: '${{nope.X}}', errors: [{ kind: 'missing-entity' }] })
    expect(valueOf(result, 'api', 'B').errors[0]!.kind).toBe('missing-variable')
  })

  it('detects cycles and marks dependants as upstream errors', () => {
    const result = resolveProject(
      project({
        a: { X: '${{b.Y}}' },
        b: { Y: '${{a.X}}', SELF: '${{b.SELF}}' },
        c: { Z: 'z-${{a.X}}' },
      }),
    )
    expect(valueOf(result, 'a', 'X').errors[0]!.kind).toBe('cycle')
    expect(valueOf(result, 'b', 'SELF').errors[0]!.kind).toBe('cycle')
    expect(valueOf(result, 'c', 'Z')).toMatchObject({ value: 'z-${{a.X}}', errors: [{ kind: 'upstream' }] })
  })
})

describe('entity names with uppercase', () => {
  it('resolves references to mixed-case entities, case-sensitively', () => {
    const result = resolveProject(
      project({
        MyApi: { PORT: '8080' },
        web: { API: 'http://x:${{MyApi.PORT}}', BAD: '${{myapi.PORT}}' },
      }),
    )
    expect(valueOf(result, 'web', 'API').value).toBe('http://x:8080')
    expect(valueOf(result, 'web', 'BAD').errors[0]).toMatchObject({
      kind: 'missing-entity',
      message: expect.stringContaining('«MyApi»'),
    })
  })
})
