/**
 * Demo data for local development. Requires the dev server running (`pnpm dev`)
 * so the account is created through better-auth.
 *
 *   pnpm --filter @vm/web seed
 */
import { encrypt, parseEncryptionKey } from '@vm/core/crypto'
import { createDb, eq, schema } from '@vm/db'

export const DEMO_USER = { name: 'Demo', email: 'demo@variables.test', password: 'demo-variables-2026' }

const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4710'
const key = parseEncryptionKey(process.env.ENCRYPTION_KEY)
const db = createDb(process.env.DATABASE_PATH ?? './data.sqlite')

const entities: Record<string, { description: string; tint: number; vars: Record<string, string> }> = {
  api: {
    description: 'API REST en Node que atiende la tienda y el panel.',
    tint: 0,
    vars: {
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_URL: '${{postgres.DATABASE_URL}}',
      REDIS_URL: '${{redis.REDIS_URL}}',
      JWT_SECRET: 'f3b9c1e07a5d4c2e9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6',
      STRIPE_SECRET_KEY: 'stripe-demo-key-no-es-real-reemplazame',
      PUBLIC_WEB_URL: '${{web.PUBLIC_URL}}',
      LOG_LEVEL: 'info',
      S3_BUCKET: 'tienda-assets-prod',
      SMTP_HOST: '${{mailer.SMTP_HOST}}',
    },
  },
  web: {
    description: 'Front de la tienda.',
    tint: 1,
    vars: {
      PUBLIC_URL: 'https://tienda.example.com',
      API_URL: 'https://api.tienda.example.com:${{api.PORT}}',
      SENTRY_DSN: 'https://8f2c1a9b4e7d@o451234.ingest.sentry.io/5512345',
    },
  },
  postgres: {
    description: 'Base de datos principal.',
    tint: 2,
    vars: {
      PGHOST: 'db.internal',
      PGUSER: 'tienda',
      PGPASSWORD: 'p4ss-W0rd-9f2c1a',
      PGDATABASE: 'tienda',
      DATABASE_URL: 'postgres://${{postgres.PGUSER}}:${{postgres.PGPASSWORD}}@${{postgres.PGHOST}}:5432/${{postgres.PGDATABASE}}',
    },
  },
  redis: {
    description: 'Caché y colas.',
    tint: 3,
    vars: { REDIS_PASSWORD: 'r3d1s-s3cr3t', REDIS_URL: 'redis://:${{redis.REDIS_PASSWORD}}@cache.internal:6379/0' },
  },
  worker: {
    description: 'Procesa pedidos y correos en segundo plano.',
    tint: 4,
    vars: { DATABASE_URL: '${{postgres.DATABASE_URL}}', REDIS_URL: '${{redis.REDIS_URL}}', CONCURRENCY: '4' },
  },
}

async function main() {
  const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: baseUrl },
    body: JSON.stringify(DEMO_USER),
  })
  if (!response.ok && response.status !== 422) {
    throw new Error(`No se pudo crear el usuario demo: ${response.status} ${await response.text()}`)
  }
  const user = db.select().from(schema.user).where(eq(schema.user.email, DEMO_USER.email)).get()
  if (!user) throw new Error('Usuario demo no encontrado')

  const existing = db.select().from(schema.project).where(eq(schema.project.userId, user.id)).all()
  if (existing.some((p) => p.name === 'tienda-online')) {
    console.log('El proyecto demo ya existe.')
    return
  }

  const projectId = crypto.randomUUID()
  db.insert(schema.project)
    .values({ id: projectId, userId: user.id, name: 'tienda-online', description: 'Tienda, API y servicios de producción.' })
    .run()
  for (const [name, spec] of Object.entries(entities)) {
    const entityId = crypto.randomUUID()
    db.insert(schema.entity)
      .values({ id: entityId, projectId, name, description: spec.description, tint: spec.tint })
      .run()
    Object.entries(spec.vars).forEach(([varKey, value], position) => {
      db.insert(schema.variable)
        .values({ id: crypto.randomUUID(), entityId, key: varKey, valueEncrypted: encrypt(value, key, entityId), position })
        .run()
    })
  }
  console.log(`Proyecto demo creado para ${DEMO_USER.email}`)
}

await main()
