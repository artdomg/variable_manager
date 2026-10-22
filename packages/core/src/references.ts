import type { EnvEntry } from './env'

/** Letters (either case), digits, `-` and `_`, starting with a letter or digit. */
export const ENTITY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

/** Matches `${{entity.VARIABLE}}`, tolerating inner whitespace. */
const REFERENCE_SOURCE = String.raw`\$\{\{\s*([A-Za-z0-9][A-Za-z0-9_-]*)\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}`

export function isValidEntityName(name: string): boolean {
  return ENTITY_NAME_PATTERN.test(name)
}

export interface Reference {
  /** The literal text as written, e.g. `${{postgres.DATABASE_URL}}`. */
  match: string
  entity: string
  key: string
  start: number
  end: number
}

export function findReferences(value: string): Reference[] {
  const pattern = new RegExp(REFERENCE_SOURCE, 'g')
  const references: Reference[] = []
  for (const m of value.matchAll(pattern)) {
    references.push({
      match: m[0],
      entity: m[1]!,
      key: m[2]!,
      start: m.index,
      end: m.index + m[0].length,
    })
  }
  return references
}

export type ReferenceErrorKind = 'missing-entity' | 'missing-variable' | 'cycle' | 'upstream'

/** Structured so each UI can word it in its own language. */
export interface ReferenceError {
  kind: ReferenceErrorKind
  /** `entity.KEY` of the reference that failed. */
  target: string
  entity: string
  key: string
  /** missing-entity: an existing entity whose name differs only by case. */
  suggestion?: string
  /** cycle: the `entity.KEY` nodes forming the cycle. */
  cycle?: string[]
}

export interface ResolvedVariable {
  key: string
  raw: string
  value: string
  references: Reference[]
  errors: ReferenceError[]
}

export interface EntityVariables {
  name: string
  variables: EnvEntry[]
}

const id = (entity: string, key: string) => `${entity}.${key}`

/**
 * Resolves every `${{entity.KEY}}` reference across the entities of a project.
 * Unresolvable references are left verbatim in `value` and reported in
 * `errors`, so nothing is silently blanked.
 */
export function resolveProject(entities: EntityVariables[]): Map<string, ResolvedVariable[]> {
  const raw = new Map<string, string>()
  const entityNames = new Set<string>()
  for (const entity of entities) {
    entityNames.add(entity.name)
    for (const variable of entity.variables) raw.set(id(entity.name, variable.key), variable.value)
  }

  const referencesOf = new Map<string, Reference[]>()
  for (const [node, value] of raw) referencesOf.set(node, findReferences(value))

  const cycleOf = findCycles(raw, referencesOf)
  const memo = new Map<string, { value: string; errors: ReferenceError[] }>()

  const resolve = (node: string): { value: string; errors: ReferenceError[] } => {
    const cached = memo.get(node)
    if (cached) return cached

    const value = raw.get(node)!
    const references = referencesOf.get(node)!
    const errors: ReferenceError[] = []
    let output = ''
    let cursor = 0

    for (const ref of references) {
      output += value.slice(cursor, ref.start)
      cursor = ref.end
      const target = id(ref.entity, ref.key)

      if (!entityNames.has(ref.entity)) {
        const lower = ref.entity.toLowerCase()
        const likely = [...entityNames].find((name) => name.toLowerCase() === lower)
        errors.push({ kind: 'missing-entity', target, entity: ref.entity, key: ref.key, suggestion: likely })
        output += ref.match
        continue
      }
      if (!raw.has(target)) {
        errors.push({ kind: 'missing-variable', target, entity: ref.entity, key: ref.key })
        output += ref.match
        continue
      }

      const targetCycle = cycleOf.get(target)
      if (targetCycle) {
        const inSameCycle = cycleOf.get(node) === targetCycle
        errors.push({
          kind: inSameCycle ? 'cycle' : 'upstream',
          target,
          entity: ref.entity,
          key: ref.key,
          cycle: [...targetCycle],
        })
        output += ref.match
        continue
      }

      const resolved = resolve(target)
      if (resolved.errors.length > 0) {
        errors.push({ kind: 'upstream', target, entity: ref.entity, key: ref.key })
      }
      output += resolved.value
    }
    output += value.slice(cursor)

    const result = { value: output, errors }
    memo.set(node, result)
    return result
  }

  const result = new Map<string, ResolvedVariable[]>()
  for (const entity of entities) {
    result.set(
      entity.name,
      entity.variables.map((variable) => {
        const node = id(entity.name, variable.key)
        const resolved = resolve(node)
        return {
          key: variable.key,
          raw: variable.value,
          value: resolved.value,
          references: referencesOf.get(node)!,
          errors: resolved.errors,
        }
      }),
    )
  }
  return result
}

/**
 * Tarjan's strongly connected components. Returns, for every node that sits on
 * a cycle, the (shared) set of nodes in its cycle.
 */
function findCycles(raw: Map<string, string>, referencesOf: Map<string, Reference[]>) {
  const edges = (node: string) =>
    referencesOf
      .get(node)!
      .map((ref) => id(ref.entity, ref.key))
      .filter((target) => raw.has(target))

  let index = 0
  const indices = new Map<string, number>()
  const lowlink = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const cycleOf = new Map<string, Set<string>>()

  const connect = (node: string) => {
    indices.set(node, index)
    lowlink.set(node, index)
    index++
    stack.push(node)
    onStack.add(node)

    for (const target of edges(node)) {
      if (!indices.has(target)) {
        connect(target)
        lowlink.set(node, Math.min(lowlink.get(node)!, lowlink.get(target)!))
      } else if (onStack.has(target)) {
        lowlink.set(node, Math.min(lowlink.get(node)!, indices.get(target)!))
      }
    }

    if (lowlink.get(node) === indices.get(node)) {
      const component = new Set<string>()
      let member: string
      do {
        member = stack.pop()!
        onStack.delete(member)
        component.add(member)
      } while (member !== node)

      const selfLoop = edges(node).includes(node)
      if (component.size > 1 || selfLoop) {
        for (const m of component) cycleOf.set(m, component)
      }
    }
  }

  for (const node of raw.keys()) if (!indices.has(node)) connect(node)
  return cycleOf
}
