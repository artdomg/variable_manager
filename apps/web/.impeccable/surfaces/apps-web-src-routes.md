---
version: 1
slug: "apps-web-src-routes"
primary_target: "apps/web/src/routes"
related_targets: []
---

# Surface: app (proyectos, entidades, variables)

Scope: the whole authenticated app plus signup/login. Visitor mode: Operate.
Audience and job: a developer on a laptop, beside editor and terminal, opening the app for short sessions to look up, copy or edit env vars, check that references resolve, and copy a ready `.env` block.
Constraints: Spanish UI; secrets hidden by default; four views of one entity (Variables, Raw, JSON, Resuelto) plus a project-wide resolved view; reference errors visible where they occur.
Memorable moment: hidden values drawn as the entity's own security tint; revealing lifts the tint like a window envelope.

## Direction contract

THESIS: Each entity is an envelope with its own security tint; a secret is hidden under its entity's tint and references carry the tint of the entity they point to. Refuses the category default of grey dots, lock icons and a neutral zinc sidebar.

OWN-WORLD: White bond paper ground (#fbfbf8), deep tint-ink blue rail (#26326b) with pale ink, window-envelope pale blue (#dfe4f2) for selection, stamp red (#c4372d) only for broken references and destructive actions, ledger green (#2f7a50) for saved/confirmed. Tint patterns (diagonal lines, crosshatch, guilloché waves, dots, tiny wordmark) in tint blue, reserved for hidden values and entity identity only. One workhorse sans plus a mono for keys and values; the variable table at one size, rank by weight and mono vs sans. Hairline rules, no cards around lists.

STORY: The developer sees the project's entities each marked by a tint, opens one, scans keys, reveals or copies a value, follows a reference chip to its source, spots a broken reference in red, and copies the resolved `.env`.

FIRST VIEWPORT: Left rail (240px, tint blue): app mark, project name, entity list with tint swatch and variable count, "Nueva entidad", link to "Vista resuelta", user menu at foot. Main: entity header (name in mono, description, actions "Copiar .env" and "Nueva variable" top right), tabs Variables / Raw / JSON / Resuelto, then the edge-to-edge variable table: key (bold mono), value (tint strip when hidden, mono text when shown, reference chips with target tint swatch), meta readout, row actions.

FORM: Security-tint envelope interiors, position 5 of 7 on the ordered list. seed:97a52646351ec457
Raises: tint reserved for one job (from terminal wayfinding); single-size table ranked by weight and case (from timetable rack); compact edge-to-edge rows with codes (from convention catalog); no cards around lists (from Metro); tiny mono metadata readouts (from type specimen).
Signature interaction: Mostrar lifts the tint off a value with a short clip/opacity wipe; references show the target entity's tint swatch.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
