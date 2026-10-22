import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

export { schema }

export const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url))

export function createDb(path: string) {
  const sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof createDb>

export function runMigrations(db: Db, folder = migrationsFolder) {
  migrate(db, { migrationsFolder: folder })
}

// Re-exported so consumers share this package's drizzle-orm instance (and its types).
export { and, asc, count, desc, eq, inArray, max, sql } from 'drizzle-orm'
