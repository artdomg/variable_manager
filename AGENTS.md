# AGENTS.md

pnpm monorepo: `apps/web` (TanStack Start), `packages/core` (env parsing, references, crypto), `packages/db` (Drizzle + SQLite). UI copy is Spanish.

## Commands

- `pnpm dev` · `pnpm test` · `pnpm typecheck` · `pnpm build`
- Port: `PORT` in `apps/web/.env` (default 4710, `strictPort`); keep `BETTER_AUTH_URL` on the same port or sessions break.
- Schema change: edit `packages/db/src/schema.ts`, then `pnpm db:generate`. Migrations apply on server start.
- Demo data: `pnpm --filter @vm/web seed` (dev server must be running).

## Rules

- Every server function that touches user data uses `authMiddleware` and checks ownership (`ownedProject` / `ownedEntity`).
- Values are only stored encrypted (`sealValue` / `openValue`, AES-256-GCM, entity id as AAD). Never log or return them outside the owner's requests; search indexes keys only.
- Reference syntax and resolution live in `packages/core` only; add tests there for any change.
- Entity names: `[A-Za-z0-9][A-Za-z0-9_-]*`, unique per project ignoring case; references are case-sensitive.
- After mutations invalidate through `useInvalidateProject` (references cross entities). Keep new queries under the `projects` key if they derive from projects.
- UI follows `DESIGN.md`: security tints only for hidden values and entity identity, stamp red only for broken refs/destruction, tables switch layout by container queries (`@lg`, `@3xl`). Run `~/.claude/skills/impeccable/scripts/impeccable detect --json apps/web/src` after UI edits.

## Gotchas

- pnpm 12 blocks native builds; `better-sqlite3` and `esbuild` are approved under `allowBuilds` in `pnpm-workspace.yaml`.
- Don't add `drizzle-orm` to `apps/web`: better-auth resolves a second copy (kysely peer) with incompatible types. Import operators from `@vm/db`.
- Vite doesn't load `.env` into `process.env` for server code; `vite.config.ts` does it.
- After login, refetch the session with `fetchQuery({ ...sessionQuery(), staleTime: 0 })`; `invalidateQueries` won't refetch a query without observers, and route guards would see the stale `null`.
- Production (Nitro) needs `better-sqlite3` as a direct dependency of `apps/web` and `MIGRATIONS_PATH=../../packages/db/migrations`.
- SQLite sorts case-sensitively; order entity names with `lower(name)`.
- Inside `inline-flex` with `gap`, separate text nodes become separate flex items; wrap mixed text in one `<span>`.
- GitHub push protection rejects anything shaped like a real key (e.g. `sk_test_…`), even fake demo values; keep seed values obviously fake.
