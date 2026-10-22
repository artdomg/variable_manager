import { createDb, runMigrations } from './index'

const path = process.env.DATABASE_PATH ?? '../../apps/web/data.sqlite'
runMigrations(createDb(path))
console.log(`Migraciones aplicadas en ${path}`)
