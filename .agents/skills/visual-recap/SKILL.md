---
name: visual-recap
description: >-
  Turn a PR, branch, commit, or git diff into an interactive visual recap with
  diagrams, file maps, API/schema summaries, annotated diffs, and focused review
  notes.
metadata:
  visibility: exported
---

# Visual Recap

`/visual-recap` creates a visual plan built **from** a diff, not toward one. It
is the reverse of forward planning: instead of describing the change you are
about to make, you describe the change that was just made, at a higher altitude
than line-by-line review. The same plan data model serves both directions —
schema, API, file, and architecture changes become the same `data-model`,
`api-endpoint`, `file-tree`, and `diagram` blocks a forward plan would use, only
now they summarize work that exists. A reviewer scans the shape of the change
before spending attention on the literal lines.

## Publish As An Agent-Native Plan — Never Inline

The deliverable is ALWAYS a published Agent-Native Plan, created with
`create-visual-recap` on the Plan MCP connector — NEVER inline chat content (not
Markdown prose, an ASCII sketch, a table, a fenced "wireframe", or a "here's the
recap" summary). A recap's entire value is the hosted, interactive, annotatable
plan; an inline summary is not a degraded recap, it is the thing a recap
replaces. If the `plan` (or legacy `agent-native-plans`) tools are not visible,
discover them through the host's `tool_search` first; if they are still missing,
STOP and give the user the client-specific reconnect step rather than improvising
an inline recap. Before publishing, or whenever a connector or auth error
appears, READ `references/connection.md` in this skill directory — it is the
single source of truth for the never-inline rule, connector discovery, and the
per-client reconnect steps. Local-files privacy mode (below) is the one
exception.

## Local-Files Privacy Mode — read `references/local-files.md`

When the user wants no hosted Plan database writes — no DB writes, no Plan MCP
publish, fully local/offline/private recaps, or `AGENT_NATIVE_PLANS_MODE=local-files`
— do not call any hosted Plan tool except the schema-only `get-plan-blocks`
catalog lookup. Read the diff with the local `recap collect-diff` / `scan` /
`build-prompt --local-files` helpers, author a local MDX folder (set
`kind: "recap"` and `localOnly: true`), and preview it with `plan local check`,
`plan local serve --kind recap`, and `plan local verify --kind recap`. Before
using local-files mode, READ `references/local-files.md` in this skill directory
— it is the single source of truth for the full contract.

### Standalone HTML Recaps (Zero-Dependency fallback)
If package installation of `@agent-native/core` fails, is restricted, or the project runs a dev server, DO NOT install any additional dependencies. Instead, write a fully self-contained HTML/CSS/JS file to `public/diff-viewer.html` containing:
- **English-only Developer Shell**: Use LTR layout, English titles, labels, and summaries for developer review comfort.
- **Stacked Diffs Sidebar Layout**: Group the changed files dynamically into logical layers (e.g. Layer 1: Security & Config, Layer 2: Core Logic, Layer 3: UI Layout, Layer 4: Catch-All Pages, Layer 5: Verification Suite) rather than a flat alphabetical list.
- **Priority Tags**: Label each file item in the list with category badges: `Logic` (for core files), `Test` (for test files), or `Config` (for configuration files).
- **Interactive Mockups**: Embed HTML wireframes representing visual/page changes (including custom UI interactive states like toggles for loading transitions).
- **Inline AI Review Notes**: Populate diff objects with comments and annotations on load-bearing lines. Display these directly inline below the code row as styled highlight boxes.
- **Code Syntax Highlighting**: Load Prism.js from CDN (with support for TS, JSX, TSX) and style Prism CSS classes natively within the dashboard.
The user can then review the visual recap directly at `http://localhost:4000/diff-viewer.html`.

## When To Use

Build a recap when a PR or commit is large, multi-file, or touches schema, API
contracts, or architecture, and a reviewer would benefit from seeing the change
mapped to structured blocks before reading the raw diff. A GitHub Action can
generate one automatically from a PR diff; an agent can generate one on request
("recap this PR", "show me what this branch changed"). Skip it for small,
single-file, or obvious diffs — a recap is review overhead, and a tiny change
reviews faster as plain diff.

## Recap The Whole Work Unit

When `/visual-recap` is invoked in a chat thread after work has already happened,
the default scope is the whole current work unit/thread, not only the most recent
user message, tool action, or follow-up fix. Gather the thread-owned changes
across the conversation: original implementation work, later bug fixes, UI
follow-ups, tests, changesets, skill/instruction updates, generated plan/source
artifacts, and any local import/linking fixes needed to make the recap open.

Use the current diff plus conversation context to separate thread-owned changes
from unrelated dirty work that existed before the thread. Exclude unrelated
pre-existing edits. If the scope is genuinely ambiguous and cannot be inferred,
state the assumption or ask a concise question before publishing.

When updating an existing recap after feedback, revise the recap so it still
covers the whole thread/work unit plus the new correction. Do not replace a broad
recap with a narrow recap of only the latest feedback unless the user explicitly
asks for that narrower scope.

## Keep The Recap Body Lean

Do not add boilerplate intro, disclaimer, provenance, or summary prose blocks to
the generated plan body. In particular, do not create a `rich-text` block just to
say the recap is an aid, that the reviewer should still review the diff, how many
files changed, or which ref/working tree generated the recap. The plan title,
brief, and `file-tree` (which carries the per-file change stats) already carry
that context.

Only add prose blocks when they tell the reviewer something specific about the
change that the structured blocks do not: the objective, a real compatibility
risk, an important decision visible in the diff, or a grounded review note.

## Recaps Must Be Substantial

Lean is not the same as thin. A recap is not a single wireframe plus one
sentence — that under-serves the reviewer as much as boilerplate prose over-serves
them. Alongside the visual/structural headline (wireframes, `data-model`,
`api-endpoint`, `diagram`), a substantial recap also carries the implementation
evidence:

- A short surface/state inventory before authoring: list the changed routes,
  components, popovers/dialogs, role/access states, empty/error states, and
  shared abstractions visible in the diff. The final recap must either represent
  each meaningful item with a block or intentionally omit it because it is tiny,
  redundant, or not user-visible.
- A `file-tree` of the changed files with each entry's `change` flag, so the
  reviewer sees the footprint of the work at a glance.
- The split `diff` of the KEY changed files, grouped under a `## Key changes`
  `rich-text` heading in a single horizontal `tabs` block (the default
  orientation, one file per tab), with a one-line `summary` and a few
  `annotations` on each — so the reviewer can drop from the high-altitude shape
  straight into the load-bearing code. Use horizontal file tabs, not a vertical
  side rail, so the selected file has enough width for the side-by-side diff.

Skip the diff appendix only for a genuinely tiny change that reviews faster as
plain diff (see "When To Use"); for any change worth recapping, the file-tree and
key-change diffs belong in the plan.

## Canonical Shape And Budgets

A strong recap follows one skeleton, top to bottom:

1. UI-impact headline — wireframes first, when the diff changed rendered UI.
2. Short outcome narrative (`rich-text`): what changed and why, 1-3 paragraphs.
3. `data-model` / `api-endpoint` blocks for schema and contract changes.
4. `file-tree` of the changed files with `change` flags.
5. `## Key changes` — one horizontal `tabs` block of `diff` / `annotated-code`.

Budgets that keep the recap reviewable:

- 3-8 key-change tabs. Fewer than 3 on a large change under-serves the
  reviewer; more than 8 stops being a summary.
- Keep each diff/annotated-code excerpt focused — prefer under ~150 lines per
  tab; summarize or link the rest of a long file instead of dumping it.
- Title at most ~70 characters; brief 1-3 sentences.

**GOOD.** A 25-file auth change: Before/After wireframes of the login surface,
a two-paragraph narrative, a diff-aware `data-model` of the sessions table, an
`api-endpoint` for the new refresh route, a `file-tree` with change flags, and
`## Key changes` with five focused tabs, each with a one-line `summary` and a
few annotations on the load-bearing hunks.

**BAD.** One giant unsegmented diff dump with no summaries or annotations; or a
sparse three-block recap of a 40-file change (one wireframe, one sentence, one
file list) that forces the reviewer back into the raw diff anyway.

## UI Impact Needs Wireframes

When the diff changes rendered UI, layout, density, visual state, interaction
affordances, navigation, controls, menus, dialogs, or design tokens, the recap
MUST include one or more wireframes. Prose and file diffs are not a substitute
for showing what changed visually.

Before choosing wireframes, make a UI coverage pass from the diff:

- Identify the entry surface where the change appears, such as a page header,
  list row, toolbar, route shell, or menu trigger.
- Identify the interaction surface that opens or changes, such as a popover,
  dialog, tab, sheet, dropdown, inline editor, or toast.
- Identify the resulting destination or persistent state, such as a public page,
  read-only view, empty state, error state, loading state, permission-denied
  state, or saved/shared state.
- Identify access or role variants when permissions change. Owner/admin/editor
  versus viewer/non-manager differences are visual behavior and need a compact
  matrix, paired wireframes, or clearly labeled state sequence.

For UI-heavy PRs, a single before/after of the entry surface is not enough.
Show the changed entry point, the main changed interaction surface, and the
resulting/destination state. Add more states when the diff adds tabs, role-based
controls, public/private visibility, invite/manage flows, destructive controls,
or empty/error branches.

Choose the smallest visual surface that makes the review clear:

- Use a `Before` / `After` wireframe pair when the reviewer benefits from direct
  comparison, such as a removed or added control, a changed state, layout
  density, ordering, navigation, or a visible component replacement.
  `references/wireframe.md` owns how to lay that pair out (columns vs.
  vertical stack by geometry).
- Use an after-only wireframe when the change is purely additive or the "before"
  state would only show absence without adding review value.
- Use more than two wireframes when the UI change is flow-dependent, responsive,
  or stateful; show the meaningful states in order instead of forcing a single
  before/after pair.
- For tiny surfaces like menus, popovers, dialogs, toasts, or panels, use the
  matching `surface` (`popover`, `panel`, etc.) and show the focused sub-surface.
  Do not redraw a full page unless placement in the page is itself part of the
  change.

Ground each wireframe in the changed UI behavior, component names, file paths,
and diff-visible labels/states. If exact pixels are inferred rather than
captured, say so in the wireframe caption or a concise annotation. For
local/manual recaps, import or update the plan source that holds the wireframes
so the rendered recap opens with the UI visual available.

## Wireframe Quality — read `references/wireframe.md`

UI recap/plan wireframes must meet a strict quality bar — full-width chrome,
pinned bottom bars, real product content, before/after comparability, the right
`surface` preset, `--wf-*` tokens instead of hex, and no `<html>`/`<style>`/font
tags. Before authoring ANY wireframe / `<Screen>` / `WireframeBlock`, READ
`references/wireframe.md` in this skill directory — it is the single source of
truth for HTML wireframe quality, shared word for word with `/visual-plan`
and `/visual-recap`. Do not author wireframes from memory.

Use the standard `WireframeBlock` / `<Screen>` format so the Plan viewer owns the
surface frame, theme, and sketchy/clean toggle. HTML wireframes are appropriate
when placement precision matters, especially popovers, menus, dialogs, and dense
forms. For HTML
wireframes, keep `renderMode` unset or `wireframe` unless a design-only editable
mockup is explicitly required, because `renderMode="design"` disables the
`sketchy` rough overlay.

When a browser tool is available, render a UI-impact recap in the Plan viewer
and visually inspect it at the current theme before sharing. If any label,
annotation, toolbar, or wireframe content overlaps another element, fix the MDX
and re-import before reporting the link. A text-match screenshot is not enough;
visually inspect the captured image. When no browser is available (for example
a headless CI agent), state that in the recap handoff instead.

## Top Canvas Recaps — read `../visual-plan/references/canvas.md`

When a recap includes a top canvas, storyboard, or flow view, READ
`../visual-plan/references/canvas.md` before authoring `canvas.mdx`. Recap
canvas artboards must use the same HTML wireframe path as good document-body
wireframes: `<Screen surface="..." html={...} />` with a semantic HTML fragment.
Do not author fresh kit-tree children such as `<FrameScreen>`, `<Card>`,
`<Row>`, `<Title>`, or `<Btn>` inside canvas `<Screen>` tags. Those components
are legacy compatibility markup for old plans; in new canvas storyboards they
can produce cramped or overlapping layouts even when the inline body wireframe
looks good. If a canvas mockup looks worse than the same screen below the fold,
assume it used the legacy kit path and replace it with an HTML screen.

## Open And Report The Recap

In local-files privacy mode, run `plan local check` first, then report the local
bridge URL from
`npx @agent-native/core@latest plan local serve --dir <plan-dir> --kind recap --open`
or from `<plan-dir>/.plan-url`. It opens the hosted Plan UI but reads from the
localhost bridge on this machine, so it is not shareable across machines. If the
Plan app itself is running locally with the same `PLAN_LOCAL_DIR`, the
`/local-plans/<slug>` URL on localhost is also correct.

In hosted mode, output the published plan URL returned by `create-visual-recap` or
`plan publish`. Do not output a localhost bridge URL in hosted mode, and do not
output a database ID or JSON dump.
