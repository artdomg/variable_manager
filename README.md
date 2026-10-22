# Variables

Environment variable manager: projects → entities → encrypted variables, with cross-entity references (`${{entity.VARIABLE}}`) and a view of the fully resolved values. The UI is available in Spanish and English.

## Structure

```
apps/web        TanStack Start (React): UI, server functions, better-auth, i18n
packages/core   .env and JSON parsing/serialization, reference resolution, AES-256-GCM encryption
packages/db     Drizzle schema (SQLite), client and migrations
```

## Getting started

```bash
pnpm install
```

```bash
cp apps/web/.env.example apps/web/.env
```

Fill in `ENCRYPTION_KEY` and `BETTER_AUTH_SECRET` in `apps/web/.env` (generate each with `openssl rand -base64 32`). Migrations run automatically on startup.

```bash
pnpm dev
```

Open http://localhost:4710 (the port is set with `PORT` in `apps/web/.env`). To load a sample project (with the server running):

```bash
pnpm --filter @vm/web seed
```

The demo user is defined in `apps/web/scripts/seed.ts`.

## Production

```bash
pnpm build
```

```bash
cd apps/web && MIGRATIONS_PATH=../../packages/db/migrations pnpm start
```

## How it works

- **Encryption**: each value is stored as `v1.<iv>.<tag>.<ciphertext>` (AES-256-GCM) with the entity id as additional authenticated data, so a value copied to another row won't decrypt. The key never leaves the server; if `ENCRYPTION_KEY` is lost, the values can't be recovered.
- **References**: `${{entity.VARIABLE}}` anywhere in a value, even mixed with text (`postgres://${{db.USER}}@…`). They resolve recursively; references to missing entities or variables, and cycles, are reported on the row and left verbatim in the resolved value.
- **Entity names**: letters (upper or lower case), numbers, `-` and `_`. References are case-sensitive, but two entities can't differ only by case (`api` and `API`); when a reference fails only because of case, the error suggests the right name.
- **Renaming an entity** rewrites every reference to it across the project.
- **Search (⌘K / Ctrl K)**: finds variables, entities and projects across all your projects, including `entity.VARIABLE` queries. Only names are searched; values are never decrypted for search.
- **Views**: per variable (inline editing with autocomplete after typing `${{`), Raw (`.env`), JSON and Resolved, plus a resolved view of the whole project.
- **Languages**: Spanish and English. The first visit follows the browser language; after that, the choice from the language menu (user menu, or the login screen) is stored in a cookie.

## Tests

```bash
pnpm test
```
