# HTML wireframe quality — single source of truth

This file is the canonical quality bar for HTML wireframes / `<Screen>` /
`WireframeBlock` content, shared word for word by `/visual-plan` and
`/visual-recap`. Read it in full before authoring ANY wireframe; do not
author wireframes from memory or paraphrase these rules per command.

<!-- SHARED-CORE:wireframe-quality START -->

**A wireframe is an HTML mockup. The renderer owns the look; you write the
content.** Set `data.html` to a self-contained, semantic HTML fragment of the
screen and set `data.surface`. The renderer owns the surface footprint/aspect,
the dark/light theme, the hand-drawn font, and the rough.js sketch overlay — you
never write `<html>`/`<body>`/`<script>`/`<style>` tags or any
width/height/coordinates. You write real HTML layout and real product
content; the renderer styles and roughens it.

**A wireframe block's data is an HTML screen plus a surface:**

```json
{
  "surface": "browser",
  "html": "<div style=\"display:flex;flex-direction:column;gap:10px;padding:16px;height:100%\"><h1>Sign in</h1><p class=\"wf-muted\">Use your work email to continue.</p><div class=\"wf-card\" style=\"display:flex;flex-direction:column;gap:10px\"><label>Email<input value=\"jane@acme.co\" /></label><label>Password<input value=\"••••••••\" /></label><label style=\"display:flex;align-items:center;gap:8px\"><input type=\"checkbox\" checked /> Remember me</label><button class=\"primary\">Sign in</button></div><a href=\"#\">Forgot password?</a></div>"
}
```

**Write PLAIN semantic HTML and let the renderer style it.** Bare elements
(`h1`/`h2`/`h3`, `p`, `button`, `input`, `<input type="checkbox">`, `a`, `hr`)
are auto-themed — no classes needed. Helper classes carry the rest:

- `.wf-card` / `.wf-box` — a bordered, padded container (a panel, a list item).
- `.wf-pill` / `.wf-chip` — a rounded tag or filter; add `.accent`
  (`<span class="wf-pill accent">`) for the accent-filled variant.
- `.wf-muted` — secondary/muted text (or use `<small>`).
- `button.primary` or any element with `[data-primary]` — the accent-filled
  primary button.

**No decorative shadows around mockups.** Do not put `box-shadow`, `filter:
drop-shadow(...)`, Tailwind `shadow-*` classes, or other fake depth effects on a
wireframe frame, root container, `.wf-card` / `.wf-box`, or canvas artboard.
Mockups should read as flat, bordered surfaces; use spacing, borders, labels,
and annotations for separation. Only show a shadow when the real product UI
already has that shadow and it is essential to the change being reviewed.

**Use renderer icons, not visible icon words.** For icon-only buttons or leading
icons inside fields, chips, menu items, and toolbars, write an empty marker such
as `<span data-icon="mail" aria-label="Email"></span>` or
`<i data-icon="lock"></i>`. The renderer replaces it with a Tabler-style SVG and
the `.wf-icon` class sizes it to the surrounding text. Supported names and
aliases: `mail`/`email`, `lock`/`password`, `search`, `plus`/`add`, `x`/`close`,
`check`, `chevronDown`, `chevronUp`, `chevronLeft`, `chevronRight`, `dots`/`more`,
`chevron`/`caret`/`dropdown` (down chevron), `user`, `settings`, `calendar`,
`bell`, `send`, `edit`, `arrowLeft`, and `arrowRight`. Do not put visible words
like "email", "lock", "search", "chevron", or "more" where the product UI would
show an icon; use text only when it is a real label a user would read.

**Use the `--wf-*` tokens for any custom color, never hex.** The renderer flips
these on light/dark, so reading them is what keeps a mockup correct in both
themes. For any inline border, background, or text color, reference a token:
`style="border:1.4px solid var(--wf-line)"`. The tokens are `--wf-ink` (text),
--wf-muted` (secondary text), `--wf-line` (borders/dividers), `--wf-paper`
(page background), `--wf-card` (container surface), `--wf-accent` /
`--wf-accent-fg` / `--wf-accent-soft` (brand action), `--wf-warn`, `--wf-ok`,
and `--wf-radius`. Never hard-code a hex color and never set `font-family` — the
renderer owns the sketch/clean font.

**Never use host/Tailwind theme classes in wireframe HTML.** Classes such as
`bg-white`, `bg-zinc-50`, `bg-slate-950`, `text-zinc-950`,
`text-slate-400`, `border-zinc-200`, `hover:bg-slate-800`, `shadow-xl`,
or arbitrary color utilities like `bg-[#fff]` leak the host app's CSS into the
mockup and can make dark-mode canvas frames unreadable. Use bare semantic
elements, `.wf-*` helper classes, and `--wf-*` color tokens instead. Before
publishing, scan every wireframe `class` and `style` attribute: if a class sets
background, text, border, ring, fill, stroke, gradient, placeholder, decoration,
or shadow color, rewrite it to renderer tokens or remove it. Layout-only classes
are still discouraged; inline flex/grid styles are safer and easier to review.

**Keep Rough.js sparse.** The renderer sketches the outer frame, standard
`.wf-*` primitives, controls, and inline border dividers by default. Do not add
`data-rough` to broad root wrappers, dialog shells, page panels, grid cells, or
nested containers unless that single container is the visual point. Use
`data-rough` only for a deliberate one-off shape. If a mockup starts looking
like stacked/overlapping sketch lines, remove rough targets from parent
containers and let backgrounds plus spacing separate the surfaces.

**Use literal CSS lengths for spacing.** The `--wf-*` tokens are for colors and
renderer-owned visual styling, not layout spacing. Do not use guessed spacing
tokens such as `var(--wf-space-4)`, Tailwind spacing classes, or theme spacing
variables inside wireframe HTML; if a token is unavailable in the Plan renderer,
padding collapses and content hugs the border. Use explicit CSS lengths for
layout: `padding:16px`, `gap:12px`, `margin-top:18px`, `minmax(0,1fr)`.

**Lay out with inline `style` flex/grid.** You write the real layout —
`display:flex; flex-direction:column; gap:10px; padding:16px` and so on — and the
renderer never repositions anything. Compose the actual product: reproduce the
current screen, then show the modification. Real labels, real counts, real dates,
real button text grounded in the screen you read; not lorem or gray bars.

**Surface presets — match the real footprint, never default to desktop+mobile.**
Pick the `surface` that matches what the user will actually see:

- `browser`: a web page that needs a browser chrome frame around it.
- `desktop`: a full desktop app page or app shell.
- `mobile`: a phone screen, only when the work is genuinely mobile.
- `popover`: a small floating menu, dropdown, or inline popover.
- `panel`: a side panel, inspector, or sidebar widget.

A sidebar popover renders as a small surface, not a desktop page and a phone
frame. Do not emit `desktop` + `mobile` variants unless responsive behavior
actually changes the layout. For a component or widget, show one broader
app-context frame only when placement affects understanding, then the focused
component states.

**Model the actual component shell for small surfaces.** A rendered UI change
belongs in a wireframe; reserve `diagram` for architecture, dependency, state,
or data-flow relationships. Popovers, dropdown menus, command palettes, and
context menus use `surface: "popover"` unless the surrounding page placement is
the point of the change. Dialogs, sheets, inspectors, sidebars, and long
property panels use the matching `panel` / `desktop` surface as appropriate.
Show the real chrome: trigger or anchor when it matters, title/header row,
top-right actions, separators, fields, options, selected states, body content,
and footer actions that are visible in the workflow.

**Modify, don't redesign.** When the task changes an existing screen, reproduce
the current screen's real layout and footprint, and overlay your modifications clearly. Use comments or annotations inside HTML comments or visual badges to call out changed elements to the reviewer.
