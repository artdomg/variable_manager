# Variables

Gestor de variables de entorno: proyectos → entidades → variables cifradas, con referencias entre entidades (`${{entidad.VARIABLE}}`) y una vista con los valores ya resueltos.

## Estructura

```
apps/web        TanStack Start (React) — UI, server functions, better-auth
packages/core   Parseo/serialización .env y JSON, resolución de referencias, cifrado AES-256-GCM
packages/db     Esquema Drizzle (SQLite), cliente y migraciones
```

## Arranque

```bash
pnpm install
```

```bash
cp apps/web/.env.example apps/web/.env
```

Rellena `ENCRYPTION_KEY` y `BETTER_AUTH_SECRET` en `apps/web/.env` (genera cada uno con `openssl rand -base64 32`). Las migraciones se aplican solas al arrancar.

```bash
pnpm dev
```

Abre http://localhost:4710 (puerto configurable con `PORT` en `apps/web/.env`). Para cargar un proyecto de ejemplo (con el servidor corriendo):

```bash
pnpm --filter @vm/web seed
```

El usuario demo está en `apps/web/scripts/seed.ts`.

## Producción

```bash
pnpm build
```

```bash
cd apps/web && MIGRATIONS_PATH=../../packages/db/migrations pnpm start
```

## Cómo funciona

- **Cifrado**: cada valor se guarda como `v1.<iv>.<tag>.<ciphertext>` (AES-256-GCM) con el id de la entidad como dato autenticado, de modo que un valor copiado a otra fila no se descifra. La llave nunca sale del servidor; si se pierde `ENCRYPTION_KEY`, los valores no se pueden recuperar.
- **Referencias**: `${{entidad.VARIABLE}}` dentro de cualquier valor, incluso mezclado con texto (`postgres://${{db.USER}}@…`). Se resuelven de forma anidada; las referencias a entidades o variables inexistentes y los ciclos se reportan en la fila y se dejan literales en el valor resuelto.
- **Nombres de entidad**: letras (mayúsculas o minúsculas), números, `-` y `_`. Las referencias distinguen mayúsculas, pero no puede haber dos entidades que solo difieran en ellas (`api` y `API`); si una referencia falla solo por eso, el error sugiere el nombre correcto.
- **Renombrar una entidad** reescribe las referencias a ella en todo el proyecto.
- **Búsqueda (⌘K / Ctrl K)**: encuentra variables, entidades y proyectos en todos tus proyectos, también como `entidad.VARIABLE`. Solo busca nombres; los valores nunca se descifran para buscar.
- **Vistas**: por variable (edición en línea con autocompletado al escribir `${{`), Raw (`.env`), JSON y Resuelto; además una vista resuelta de todo el proyecto.

## Tests

```bash
pnpm test
```
