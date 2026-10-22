# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

pnpm monorepo; TanStack Start (React) with the TanStack libraries (Router, Query, Form); SQLite via Drizzle ORM; better-auth for email/password signup and login; Tailwind CSS with shadcn-style components on Radix UI primitives; dayjs for dates; sonner for toasts.

## Users

Individual developers. Each account owns its own projects; there is no sharing, teams, or invitations. Typical scene: a developer on their laptop, beside the editor and terminal, opening the app for short sessions to look up, copy, or edit environment variables while configuring a service or a deploy.

## Product Purpose

Keep a developer's environment variables in one place, organised as projects that contain entities (a service, an app, a database, a worker), each holding variables in env-var format (`MI_VARIABLE="MI_VALOR"`). Success: the developer finds the value they need, edits it safely, and copies a ready-to-use `.env` block without hand-assembling values from several places.

## Positioning

Entities can reference each other's variables with `${{entidad.NOMBRE_VARIABLE}}`, so a value such as a database URL is defined once and reused; a resolved view shows every variable with references substituted.

## Operating Context

Values are pasted into `.env` files, deploy dashboards, and terminals. Users switch between per-variable editing, a raw `.env` text editor, and a JSON view of the same set.

## Capabilities and Constraints

- Email/password signup and login (better-auth).
- Projects → entities → variables. Variables editable one by one, as raw `.env` text, or as JSON.
- Variable values are encrypted at rest with AES-256-GCM using a server-side master key (`ENCRYPTION_KEY` env var).
- References `${{entity.VAR}}` resolve within the same project; cycles and missing references must be reported, not silently blanked.
- A resolved view shows final values with references substituted.
- UI copy is in Spanish.

## Product Principles

1. Secrets are hidden by default and revealed deliberately.
2. One source of truth: reference, don't duplicate.
3. The `.env` text is a first-class format, not an export afterthought.
4. Errors in references are visible where they occur.
