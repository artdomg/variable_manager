---
name: Variables
description: Environment variables kept as envelopes, each entity hidden under its own security tint.
colors:
  tint: "#26326b"
  tint-deep: "#1c2554"
  envelope: "#dfe4f2"
  envelope-soft: "#eef1f8"
  rail-ink: "#cdd3ec"
  rail-muted: "#a3acd3"
  rail-line: "rgb(255 255 255 / 0.13)"
  accent-ink: "#ffffff"
  focus: "#3d55c4"
  danger: "#c4372d"
  danger-soft: "#fbefed"
  ok: "#2f7a50"
  ground: "#fbfbf8"
  panel: "#f1f1eb"
  line: "#e5e4dc"
  line-strong: "#cfd0d6"
  ink: "#1a1e2c"
  muted: "#646a7f"
  shade: "#141a38"
typography:
  headline:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.015em"
  entity-title:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
  body-lead:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.625
  key:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  value:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
  reference:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1
  meta:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "11.5px"
    fontWeight: 400
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SF Mono, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  item: "4px"
  control: "5px"
  popover: "6px"
  dialog: "8px"
spacing:
  gutter-sm: "16px"
  gutter-md: "32px"
  row-y: "10px"
  rail-x: "20px"
  tab-gap: "24px"
components:
  button-primary:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.tint-deep}"
  button-secondary:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    size: "28px"
  button-ghost-hover:
    backgroundColor: "{colors.panel}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  rail:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.rail-ink}"
    width: "248px"
  rail-item-active:
    backgroundColor: "{colors.envelope}"
    textColor: "{colors.tint}"
    typography: "{typography.key}"
    height: "36px"
  reference-chip:
    backgroundColor: "{colors.envelope-soft}"
    textColor: "{colors.tint}"
    typography: "{typography.reference}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "22px"
  reference-chip-broken:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
  table-row:
    textColor: "{colors.ink}"
    padding: "10px 32px"
  table-row-hover:
    backgroundColor: "{colors.envelope-soft}"
  dialog:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.dialog}"
    padding: "20px"
    width: "440px"
  tooltip:
    backgroundColor: "{colors.shade}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.item}"
    padding: "4px 8px"
---

# Design System: Variables

## Overview

**Creative North Star: "The Security Envelope"**

Every entity is an envelope with its own security tint, the patterned interior a bank prints so the contents cannot be read through the paper. A hidden value is drawn as a strip of its entity's tint; a reference to another entity carries that entity's tint as a swatch. The tint is the system's one expressive device and it does exactly two jobs: hiding values and identifying entities. Everything else is quiet office paper: white bond ground, a deep tint-ink blue rail, hairline rules, and dense mono readouts.

The density is a developer's working ledger, not a dashboard. Lists run edge to edge between hairlines with no cards around them; a variable table is set at one size and ranked by weight and by mono against sans. Color carries status only where it means something: stamp red for a broken reference or a destructive act, ledger green for a save confirmation. The world is light only.

Revealing is the signature motion: the tint lifts off a value like the window of an envelope, a short clip-path wipe from left to right.

**Key Characteristics:**
- Light only: bond-paper ground with a tint-ink blue rail.
- Eight security-tint patterns, painted as alpha masks in `currentColor`, reserved for hidden values and entity identity.
- Public Sans for interface prose, JetBrains Mono for keys, values, entity names and metadata readouts.
- Hairline-ruled, edge-to-edge rows; no cards around lists.
- Container-query tables that collapse from three/four columns to a stacked two-line row.
- Square identity marks (swatches, strips, chips, stamps); softly rounded controls.

## Colors

A cool ink-on-bond palette: one deep blue doing structural work, warm-white paper neutrals, and two status inks used sparingly.

### Primary
- **Tint Ink Blue** (`tint`): the rail background, primary buttons, active tab underline, page headlines, the entity title, and the default color of every security tint. It is the bank's ink, not a decorative accent.
- **Deep Tint Ink** (`tint-deep`): hover state of primary actions and the text color of selected text.
- **Window-Envelope Blue** (`envelope`): selection, the active rail item, the flash on a row reached by a reference link, and hovered reference chips.
- **Envelope Wash** (`envelope-soft`): row hover, the in-place edit row, and the resting fill of reference chips.
- **Rail Ink / Rail Muted / Rail Hairline** (`rail-ink`, `rail-muted`, `rail-line`): text, secondary labels and dividers on the blue rail. On the rail the tint is repainted in `rail-ink` through the `--tint-ink` custom property.
- **Focus Blue** (`focus`): focus outlines and the 25% field ring. Brighter than the tint so focus reads against both paper and selection.

### Secondary
- **Stamp Red** (`danger`, with `danger-soft` wash): broken references, reference errors, destructive buttons and menu items, the error toast icon.
- **Ledger Green** (`ok`): the success toast icon. Nowhere else.

### Neutral
- **Bond Paper** (`ground`): page, dialog, menu, toast and input background.
- **Ledger Panel** (`panel`): hover fill for secondary and ghost buttons and menu items.
- **Hairline** (`line`): row rules, tab baseline, overlay borders.
- **Strong Hairline** (`line-strong`): control borders, toast border, scrollbars.
- **Ink** (`ink`): body text and variable keys.
- **Muted Ink** (`muted`): descriptions, metadata readouts, column labels, idle icons.
- **Shade** (`shade`): tooltip ground and dialog/drawer scrim (at 40-50%).

### Named Rules
**The One Job Rule.** Tint patterns appear only where a value is hidden or an entity is identified (swatch, strip, reference chip, the brand mark). Never as a background texture, divider, or decoration.

**The Stamp Rule.** Red means something is broken or about to be destroyed. It never marks emphasis, counts, or ordinary validation of a well-formed state.

**The Ledger Rule.** Green appears only to confirm a completed save. No green badges, no green status dots.

## Typography

**Body Font:** Public Sans Variable (with system-ui), self-hosted via fontsource
**Mono Font:** JetBrains Mono Variable (with ui-monospace, SF Mono), self-hosted via fontsource

**Character:** a plain, civic workhorse sans for the interface and a crisp developer mono for everything that is data: keys, values, entity names, counts and timestamps. Tabular figures are on globally.

### Hierarchy
- **Headline** (600, 22px, -0.015em, tint blue): page titles such as Proyectos and Vista resuelta.
- **Entity Title** (mono 700, 24px, line-height 1, -0.02em, tint blue): the entity name beside its swatch. An entity's name is data, so it is set in mono.
- **Title** (600, 15px): dialog titles, empty-state headings, the brand wordmark (700).
- **Body** (400, 13px, 1.45): the base size for the whole app, including tables, buttons and tabs.
- **Body Lead** (400, 13.5px, relaxed): descriptions and empty-state copy, capped near 65ch.
- **Key** (mono 700, 13px, -0.01em): variable keys and active rail entities.
- **Value** (mono 400, 13px): revealed values and editors.
- **Reference** (mono 12.5px, line-height 1): reference chips, with the entity part bold.
- **Meta** (mono 400, 11.5px, muted): readouts such as "12 car. · hace 3 días", variable counts.
- **Label** (mono 500, 11px, 0.08em, uppercase, muted): table column headers and rail section labels only.

### Named Rules
**The Single-Size Table Rule.** Inside a table, rank by weight and by mono against sans, not by size: keys bold mono, values regular mono, at the same 13px.

**The Data Is Mono Rule.** Anything the user could paste into a terminal (keys, values, entity names, references, counts) is set in mono; prose and actions are set in sans.

## Layout

A two-column app shell: a sticky 248px tint rail on the left and a paper main column that is a CSS size container. Below `md` the rail becomes a drawer (min(300px, 86vw)) behind a 48px tint top bar.

Page gutters are 16px, widening to 32px at `md`. Headers sit 24-28px from the top with 20px below. Tabs are text with a 24px gap on a hairline baseline, sticky under the top bar.

Tables respond to their container, not the viewport. Below `@lg` (32rem) each row stacks: key and actions on line one, the value full-width on line two. At `@lg` it becomes one compact line (176px key, flexible value, 132px actions). At `@3xl` (48rem) a "Registro" metadata column (216px) appears and the key column flexes from 180px. Rows are 10px tall-padded (about 44px), separated only by hairlines and running edge to edge across the main column.

Rail rhythm: 20px side inset, 36px items, 24px between groups.

## Elevation & Depth

The page is flat. Depth comes from the paper/rail contrast, hairlines, and tonal washes (envelope wash on hover). Shadows exist only on things that float above the page, and they are soft, low, blue-black ambient drops.

### Shadow Vocabulary
- **Button lip** (`box-shadow: 0 1px 0 rgb(0 0 0 / 0.12)`): primary button only.
- **Popover** (`box-shadow: 0 10px 30px -10px rgb(15 20 45 / 0.3)`): menus and the reference autocomplete.
- **Toast** (`box-shadow: 0 10px 30px -12px rgb(15 20 45 / 0.35)`).
- **Dialog** (`box-shadow: 0 18px 48px -12px rgb(15 20 45 / 0.35)`), over a shade scrim at 40%.

### Named Rules
**The Flat Page Rule.** Nothing attached to the page casts a shadow; rows, headers and lists are separated by hairlines alone.

## Shapes

Two shape families. Interactive controls are softly rounded: menu items and tooltips 4px, buttons and fields 5px, menus and toasts 6px, dialogs 8px. Identity and status marks are square-cornered: tint swatches, tint strips, reference chips, the user initials block, and the "REF. ROTA" stamp (a 1.5px red border rotated -2deg, like a rubber stamp). Borders are 1px hairlines; swatches and strips carry a faint `currentColor` border (25-35%) so the pattern reads as a printed patch.

## Components

### Buttons
Quiet and compact; the only filled button is the primary.
- **Shape:** gently rounded (5px); heights 28 / 32 / 40px, 13px medium label, 16px icons.
- **Primary:** tint blue fill, white text, a 1px lip shadow; hover deepens to deep tint ink.
- **Secondary (default):** paper fill with a strong hairline border; hover to ledger panel.
- **Ghost:** no fill; hover to ledger panel. Row actions are 28px ghost icon buttons; the delete action hovers to stamp-red wash and text.
- **Danger:** stamp red fill, white text, for confirming destruction only.
- **Focus:** 2px focus-blue outline, 2px offset. Disabled at 50% opacity.

### Inputs / Fields
- **Style:** paper fill, strong hairline border, 5px radius, 32px tall, 10px horizontal padding, tint-blue caret.
- **Focus:** border turns tint blue plus a 3px focus-blue ring at 25%.
- **Error / Disabled:** `aria-invalid` turns the border stamp red with a 20% red ring and a 12px red message below; disabled at 60%.
- **Value editor:** the same field in mono, auto-growing, with a `${{` autocomplete popover listing entity.KEY with each target's swatch.

### Navigation
- **Rail:** tint blue, rail-ink text, brand mark (tint swatch 4 + "Variables"). The project switcher is a square-cornered outlined control in white at 18% border. Entities are 36px mono rows with an 18px tint swatch and count; the active row inverts to window-envelope blue with bold tint-blue text and the swatch repainted in tint blue. Section labels use the Label style in rail-muted. The user menu sits at the foot above a rail hairline.
- **Tabs:** text tabs, muted at rest, ink on hover; active is semibold tint blue with a 2px inset tint underline. Counts trail in 11px mono; a broken-reference count is bold red.

### Variable Table (signature)
Edge-to-edge rows between hairlines; key bold mono, value as tint strip or mono text, reference chips, a mono metadata readout, and ghost row actions. Hover washes the row in envelope wash. A row with a broken reference sits on a 70% red wash and lists the errors in red beneath the value, with the "REF. ROTA" stamp. A row reached via a reference link flashes from window-envelope blue (1600ms ease-out). Editing happens in place in an envelope-wash row with key, value editor, and Cancelar / Guardar.

### Security Tint
Eight patterns (`tint-0`..`tint-7`): diagonal lines, grid, guilloché waves, dots, "CONFIDENCIAL" microprint, zigzag, rule-and-tick, crosshatch. Each is an SVG alpha mask filled with `currentColor` at 62% strength, so the same pattern works on paper (tint blue) and rail (rail ink). A **strip** hides a value, its width proportional to the hidden length (clamped 4-36 characters, 0.62em each). A **swatch** (12-28px square) identifies an entity.

**Reveal:** the cover wipes away left to right with `clip-path` over 260ms `cubic-bezier(0.16, 1, 0.3, 1)` while fading over 200ms; the value fades in beneath. Under `prefers-reduced-motion` the transition is removed.

### Reference Chip
22px square-cornered mono chip: the target's 12px swatch, then **entity**.KEY. Envelope-wash fill with a pale blue border, tint-blue text; hover to window-envelope blue. Broken: stamp-red wash and text, red border, and a dashed red empty square in place of the swatch.

### Overlays
- **Menu:** paper, hairline border, 6px radius, popover shadow, 4px inset items at 4px radius; danger items in stamp red.
- **Dialog:** paper, 8px radius, 20px padding, max 440px, 12vh from top; enters with a 6px rise and 0.985 scale over 180ms expo-out.
- **Tooltip:** shade ground, white 12px text, 4px radius, 300ms delay.
- **Toast:** bottom right, paper with strong hairline, 6px radius; success icon ledger green, error icon stamp red.

## Do's and Don'ts

### Do:
- **Do** draw a hidden value as a strip of its own entity's tint, and every reference with its target entity's swatch.
- **Do** repaint tints through `--tint-ink` when placing them on the rail or another dark ground.
- **Do** set keys, values, entity names and metadata in JetBrains Mono, and rank table cells by weight rather than size (13px throughout).
- **Do** let tables respond to their container with `@lg` and `@3xl` breakpoints.
- **Do** keep rows edge to edge, separated by hairlines, with envelope wash on hover.
- **Do** guard every motion with `prefers-reduced-motion`.

### Don't:
- **Don't** use tint patterns for decoration, backgrounds, dividers or empty states; they hide values and identify entities, nothing else.
- **Don't** hide secrets with grey dots, asterisks or lock icons; the tint is the hiding device.
- **Don't** use stamp red for anything but broken references and destruction, or ledger green for anything but a completed save.
- **Don't** wrap lists or tables in cards.
- **Don't** shadow anything attached to the page; shadows are for menus, toasts and dialogs.
- **Don't** introduce a dark theme; the world is light only.
