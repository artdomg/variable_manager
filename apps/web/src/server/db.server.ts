import { createDb, migrationsFolder, runMigrations, type Db } from '@vm/db'

const globalForDb = globalThis as unknown as { __vmDb?: Db }

function init(): Db {
  const db = createDb(process.env.DATABASE_PATH ?? './data.sqlite')
  // In a production bundle the package-relative folder no longer exists; point MIGRATIONS_PATH at it.
  runMigrations(db, process.env.MIGRATIONS_PATH ?? migrationsFolder)
  return db
}

/** One connection per process; survives Vite HMR reloads in dev. */
export const db = (globalForDb.__vmDb ??= init())
