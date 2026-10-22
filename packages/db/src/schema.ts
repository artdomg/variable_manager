import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date()),
}

/* ── better-auth ─────────────────────────────────────────────── */

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  ...timestamps,
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [index('session_user_idx').on(t.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    ...timestamps,
  },
  (t) => [index('account_user_idx').on(t.userId)],
)

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  ...timestamps,
})

/* ── domain ──────────────────────────────────────────────────── */

export const project = sqliteTable(
  'project',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    ...timestamps,
  },
  (t) => [index('project_user_idx').on(t.userId)],
)

export const entity = sqliteTable(
  'entity',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    /** Name used in references: `${{name.KEY}}`. Unique per project ignoring case. */
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    /** Index of the security-tint pattern that identifies this entity in the UI. */
    tint: integer('tint').notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex('entity_project_name_idx').on(t.projectId, t.name)],
)

export const variable = sqliteTable(
  'variable',
  {
    id: text('id').primaryKey(),
    entityId: text('entity_id')
      .notNull()
      .references(() => entity.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    /** AES-256-GCM payload; see @vm/core/crypto. Never stored in plain text. */
    valueEncrypted: text('value_encrypted').notNull(),
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex('variable_entity_key_idx').on(t.entityId, t.key)],
)

export const projectRelations = relations(project, ({ many }) => ({ entities: many(entity) }))
export const entityRelations = relations(entity, ({ one, many }) => ({
  project: one(project, { fields: [entity.projectId], references: [project.id] }),
  variables: many(variable),
}))
export const variableRelations = relations(variable, ({ one }) => ({
  entity: one(entity, { fields: [variable.entityId], references: [entity.id] }),
}))
