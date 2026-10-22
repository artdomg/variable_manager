import { createServerFn } from '@tanstack/react-start'
import { isValidEntityName, isValidVariableKey, resolveProject } from '@vm/core'
import { schema } from '@vm/db'
import { and, asc, count, desc, eq, inArray, max, sql } from '@vm/db'
import { z } from 'zod'
import { openValue, sealValue } from './crypto.server'
import { db } from './db.server'
import { authMiddleware } from './session'

const { project, entity, variable } = schema

const newId = () => crypto.randomUUID()

/** Alphabetical regardless of case, so `Stripe` sorts between `redis` and `web`. */
const byEntityName = sql`lower(${entity.name})`

/** Number of security-tint patterns the UI defines (see styles.css). */
const TINT_COUNT = 8

class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} no encontrado`)
  }
}

function ownedProject(projectId: string, userId: string) {
  const row = db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.userId, userId)))
    .get()
  if (!row) throw new NotFoundError('Proyecto')
  return row
}

function ownedEntity(entityId: string, userId: string) {
  const row = db
    .select({ entity, projectUserId: project.userId })
    .from(entity)
    .innerJoin(project, eq(project.id, entity.projectId))
    .where(eq(entity.id, entityId))
    .get()
  if (!row || row.projectUserId !== userId) throw new NotFoundError('Entidad')
  return row.entity
}

const touchProject = (projectId: string) =>
  db.update(project).set({ updatedAt: new Date() }).where(eq(project.id, projectId)).run()

/** Decrypts every variable of a project, grouped by entity, in display order. */
function loadProjectVariables(projectId: string) {
  const entities = db
    .select()
    .from(entity)
    .where(eq(entity.projectId, projectId))
    .orderBy(byEntityName)
    .all()
  const rows = entities.length
    ? db
        .select()
        .from(variable)
        .where(
          inArray(
            variable.entityId,
            entities.map((e) => e.id),
          ),
        )
        .orderBy(asc(variable.position), asc(variable.key))
        .all()
    : []

  return entities.map((e) => ({
    ...e,
    variables: rows
      .filter((row) => row.entityId === e.id)
      .map((row) => ({
        id: row.id,
        key: row.key,
        value: openValue(row.valueEncrypted, e.id),
        updatedAt: row.updatedAt,
      })),
  }))
}

/* ── Projects ─────────────────────────────────────────────────── */

const projectInput = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  description: z.string().trim().max(280).default(''),
})

export const listProjects = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const projects = db
      .select()
      .from(project)
      .where(eq(project.userId, context.userId))
      .orderBy(desc(project.updatedAt))
      .all()
    if (!projects.length) return []

    const ids = projects.map((p) => p.id)
    const entityCounts = db
      .select({ projectId: entity.projectId, entities: count(entity.id) })
      .from(entity)
      .where(inArray(entity.projectId, ids))
      .groupBy(entity.projectId)
      .all()
    const variableCounts = db
      .select({ projectId: entity.projectId, variables: count(variable.id) })
      .from(variable)
      .innerJoin(entity, eq(entity.id, variable.entityId))
      .where(inArray(entity.projectId, ids))
      .groupBy(entity.projectId)
      .all()
    const entityNames = db
      .select({ projectId: entity.projectId, name: entity.name, tint: entity.tint })
      .from(entity)
      .where(inArray(entity.projectId, ids))
      .orderBy(byEntityName)
      .all()

    return projects.map((p) => ({
      ...p,
      entityCount: entityCounts.find((c) => c.projectId === p.id)?.entities ?? 0,
      variableCount: variableCounts.find((c) => c.projectId === p.id)?.variables ?? 0,
      entities: entityNames.filter((e) => e.projectId === p.id).map((e) => ({ name: e.name, tint: e.tint })),
    }))
  })

export const createProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(projectInput)
  .handler(async ({ data, context }) => {
    const id = newId()
    db.insert(project).values({ id, userId: context.userId, ...data }).run()
    return { id }
  })

export const updateProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(projectInput.extend({ projectId: z.string() }))
  .handler(async ({ data, context }) => {
    ownedProject(data.projectId, context.userId)
    db.update(project)
      .set({ name: data.name, description: data.description })
      .where(eq(project.id, data.projectId))
      .run()
  })

export const deleteProject = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data, context }) => {
    ownedProject(data.projectId, context.userId)
    db.delete(project).where(eq(project.id, data.projectId)).run()
  })

export const getProject = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data, context }) => {
    const p = ownedProject(data.projectId, context.userId)
    const entities = db
      .select({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        tint: entity.tint,
        updatedAt: entity.updatedAt,
        variableCount: count(variable.id),
      })
      .from(entity)
      .leftJoin(variable, eq(variable.entityId, entity.id))
      .where(eq(entity.projectId, p.id))
      .groupBy(entity.id)
      .orderBy(byEntityName)
      .all()
    return { ...p, entities }
  })

/* ── Entities ─────────────────────────────────────────────────── */

const entityName = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(48)
  .refine(isValidEntityName, 'Usa letras, números, «-» o «_», empezando por letra o número')

/**
 * Names are unique per project ignoring case: `api` and `API` side by side
 * would make references easy to mistake for one another.
 */
function assertEntityNameFree(projectId: string, name: string, exceptId?: string) {
  const clash = db
    .select({ id: entity.id, name: entity.name })
    .from(entity)
    .where(and(eq(entity.projectId, projectId), eq(sql`lower(${entity.name})`, name.toLowerCase())))
    .all()
    .find((e) => e.id !== exceptId)
  if (clash) throw new Error(`Ya existe una entidad llamada «${clash.name}»`)
}

export const createEntity = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string(), name: entityName, description: z.string().trim().max(280).default('') }))
  .handler(async ({ data, context }) => {
    ownedProject(data.projectId, context.userId)
    assertEntityNameFree(data.projectId, data.name)
    const used = new Set(
      db
        .select({ tint: entity.tint })
        .from(entity)
        .where(eq(entity.projectId, data.projectId))
        .all()
        .map((e) => e.tint),
    )
    // First tint not used in the project, cycling once every pattern is taken.
    let tint = 0
    while (used.has(tint) && tint < TINT_COUNT) tint++
    if (tint === TINT_COUNT) tint = used.size % TINT_COUNT
    const id = newId()
    db.insert(entity).values({ id, tint, ...data }).run()
    touchProject(data.projectId)
    return { id }
  })

/**
 * Renames an entity and rewrites every `${{old.KEY}}` reference to it across
 * the project, so existing references keep pointing at the same values.
 */
export const updateEntity = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ entityId: z.string(), name: entityName, description: z.string().trim().max(280).default('') }))
  .handler(async ({ data, context }) => {
    const current = ownedEntity(data.entityId, context.userId)
    const renamed = current.name !== data.name
    if (renamed) assertEntityNameFree(current.projectId, data.name, current.id)

    let rewritten = 0
    db.transaction((tx) => {
      tx.update(entity)
        .set({ name: data.name, description: data.description })
        .where(eq(entity.id, current.id))
        .run()
      if (!renamed) return

      const pattern = new RegExp(String.raw`(\$\{\{\s*)${escapeRegExp(current.name)}(\.)`, 'g')
      for (const e of loadProjectVariables(current.projectId)) {
        for (const v of e.variables) {
          const next = v.value.replace(pattern, `$1${data.name}$2`)
          if (next === v.value) continue
          tx.update(variable)
            .set({ valueEncrypted: sealValue(next, e.id) })
            .where(eq(variable.id, v.id))
            .run()
          rewritten++
        }
      }
    })
    touchProject(current.projectId)
    return { rewritten }
  })

export const deleteEntity = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ entityId: z.string() }))
  .handler(async ({ data, context }) => {
    const current = ownedEntity(data.entityId, context.userId)
    db.delete(entity).where(eq(entity.id, current.id)).run()
    touchProject(current.projectId)
  })

/* ── Variables ────────────────────────────────────────────────── */

/**
 * The entity with decrypted variables, each annotated with its resolved value
 * and reference errors, plus the project's other entities and keys (for
 * reference autocomplete).
 */
export const getEntity = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ entityId: z.string() }))
  .handler(async ({ data, context }) => {
    const current = ownedEntity(data.entityId, context.userId)
    const all = loadProjectVariables(current.projectId)
    const resolved = resolveProject(all.map((e) => ({ name: e.name, variables: e.variables })))
    const self = all.find((e) => e.id === current.id)!
    const resolvedSelf = resolved.get(current.name) ?? []

    const dependants: { entity: string; key: string; references: string[] }[] = []
    for (const [name, vars] of resolved) {
      for (const v of vars) {
        const refs = v.references.filter((r) => r.entity === current.name).map((r) => r.key)
        if (refs.length && name !== current.name) dependants.push({ entity: name, key: v.key, references: refs })
      }
    }

    return {
      entity: {
        id: current.id,
        projectId: current.projectId,
        name: current.name,
        description: current.description,
        tint: current.tint,
        updatedAt: current.updatedAt,
      },
      variables: self.variables.map((v, i) => ({
        ...v,
        resolved: resolvedSelf[i]!.value,
        references: resolvedSelf[i]!.references.map((r) => `${r.entity}.${r.key}`),
        errors: resolvedSelf[i]!.errors,
      })),
      catalog: all.map((e) => ({ id: e.id, name: e.name, tint: e.tint, keys: e.variables.map((v) => v.key) })),
      dependants,
    }
  })

const variableKey = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(128)
  .refine(isValidVariableKey, 'Usa letras, números y «_», sin empezar por número')

export const saveVariable = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      entityId: z.string(),
      variableId: z.string().optional(),
      key: variableKey,
      value: z.string().max(65_536),
    }),
  )
  .handler(async ({ data, context }) => {
    const current = ownedEntity(data.entityId, context.userId)
    const clash = db
      .select({ id: variable.id })
      .from(variable)
      .where(and(eq(variable.entityId, current.id), eq(variable.key, data.key)))
      .get()
    if (clash && clash.id !== data.variableId) throw new Error(`«${data.key}» ya existe en esta entidad`)

    const valueEncrypted = sealValue(data.value, current.id)
    if (data.variableId) {
      const result = db
        .update(variable)
        .set({ key: data.key, valueEncrypted })
        .where(and(eq(variable.id, data.variableId), eq(variable.entityId, current.id)))
        .run()
      if (result.changes === 0) throw new NotFoundError('Variable')
    } else {
      const last = db
        .select({ position: max(variable.position) })
        .from(variable)
        .where(eq(variable.entityId, current.id))
        .get()
      db.insert(variable)
        .values({
          id: newId(),
          entityId: current.id,
          key: data.key,
          valueEncrypted,
          position: (last?.position ?? -1) + 1,
        })
        .run()
    }
    db.update(entity).set({ updatedAt: new Date() }).where(eq(entity.id, current.id)).run()
    touchProject(current.projectId)
  })

export const deleteVariable = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(z.object({ entityId: z.string(), variableId: z.string() }))
  .handler(async ({ data, context }) => {
    const current = ownedEntity(data.entityId, context.userId)
    db.delete(variable)
      .where(and(eq(variable.id, data.variableId), eq(variable.entityId, current.id)))
      .run()
    touchProject(current.projectId)
  })

/**
 * Replaces the full set of variables from the raw `.env` or JSON editor.
 * Unchanged variables keep their ids; order follows the submitted text.
 */
export const replaceVariables = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      entityId: z.string(),
      entries: z.array(z.object({ key: variableKey, value: z.string().max(65_536) })).max(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    const current = ownedEntity(data.entityId, context.userId)
    const keys = new Set<string>()
    for (const entry of data.entries) {
      if (keys.has(entry.key)) throw new Error(`«${entry.key}» está duplicada`)
      keys.add(entry.key)
    }

    const existing = db.select().from(variable).where(eq(variable.entityId, current.id)).all()
    const byKey = new Map(existing.map((row) => [row.key, row]))
    const summary = { added: 0, updated: 0, removed: 0 }

    db.transaction((tx) => {
      data.entries.forEach((entry, position) => {
        const row = byKey.get(entry.key)
        if (!row) {
          tx.insert(variable)
            .values({
              id: newId(),
              entityId: current.id,
              key: entry.key,
              valueEncrypted: sealValue(entry.value, current.id),
              position,
            })
            .run()
          summary.added++
          return
        }
        const changed = openValue(row.valueEncrypted, current.id) !== entry.value
        tx.update(variable)
          .set(changed ? { valueEncrypted: sealValue(entry.value, current.id), position } : { position })
          .where(eq(variable.id, row.id))
          .run()
        if (changed) summary.updated++
      })
      const removed = existing.filter((row) => !keys.has(row.key)).map((row) => row.id)
      if (removed.length) tx.delete(variable).where(inArray(variable.id, removed)).run()
      summary.removed = removed.length
      tx.update(entity).set({ updatedAt: new Date() }).where(eq(entity.id, current.id)).run()
    })
    touchProject(current.projectId)
    return summary
  })

/** Every entity of a project with references substituted. */
export const getResolvedProject = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data, context }) => {
    const p = ownedProject(data.projectId, context.userId)
    const all = loadProjectVariables(p.id)
    const resolved = resolveProject(all.map((e) => ({ name: e.name, variables: e.variables })))
    return {
      project: { id: p.id, name: p.name },
      entities: all.map((e) => ({
        id: e.id,
        name: e.name,
        tint: e.tint,
        variables: (resolved.get(e.name) ?? []).map((v) => ({
          key: v.key,
          raw: v.raw,
          value: v.value,
          references: v.references.map((r) => `${r.entity}.${r.key}`),
          errors: v.errors,
        })),
      })),
    }
  })

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Everything the ⌘K palette searches: projects, entities and variable keys
 * across the user's projects. Values are never decrypted for search.
 */
export const getSearchIndex = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const projects = db
      .select({ id: project.id, name: project.name })
      .from(project)
      .where(eq(project.userId, context.userId))
      .orderBy(desc(project.updatedAt))
      .all()
    if (!projects.length) return { projects, entities: [], variables: [] }

    const entities = db
      .select({ id: entity.id, projectId: entity.projectId, name: entity.name, tint: entity.tint })
      .from(entity)
      .where(
        inArray(
          entity.projectId,
          projects.map((p) => p.id),
        ),
      )
      .orderBy(byEntityName)
      .all()
    const variables = entities.length
      ? db
          .select({ entityId: variable.entityId, key: variable.key })
          .from(variable)
          .where(
            inArray(
              variable.entityId,
              entities.map((e) => e.id),
            ),
          )
          .orderBy(asc(variable.position))
          .all()
      : []
    return { projects, entities, variables }
  })
