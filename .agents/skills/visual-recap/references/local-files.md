# Local-files privacy mode — single source of truth

This file is the canonical contract for fully local, no-database planning and
recaps. It is shared word for word by `/visual-plan` and `/visual-recap`. Read it
in full before using local-files mode; do not call any hosted Plan tool for a
local plan/recap except the schema-only block-catalog lookup described below.

<!-- SHARED-CORE:local-files START -->

**When to use it.** Use local-files privacy mode when the user explicitly asks
for no DB writes, no hosted Plan database writes, no Plan MCP publish, fully local
files, offline/private work, or repo-owned/source-controlled artifacts, or when
`AGENT_NATIVE_PLANS_MODE=local-files` is set. Also use it when a user or repo
policy says the work must stay under their own brand, domain, source control, or
infrastructure. In this mode the plan/recap data must never be sent to the Plan
MCP server or the Plan app action surface. This is the only exception to the
always-publish rule in `references/connection.md`.

The local-files contract:

- **Read context locally.** Read source, diff, and stat context from local files
  and shell commands only. For recaps, the
  `npx @agent-native/core@latest recap collect-diff`, `scan`, and
  `build-prompt --local-files` helpers are safe — they operate on local files and
  do not write to the Plan database.
- **Fetch the block catalog first** (it sends no plan content). Prefer the local
  CLI catalog command in local-files mode:
  `npx @agent-native/core@latest plan blocks --out plan-blocks.md`, then read
  that file before authoring MDX; it calls the public no-auth `get-plan-blocks`
  route and never creates a plan. If the MCP `get-plan-blocks` tool is already
  available you may use that schema-only lookup, but do not use tool discovery as
  a prelude to hosted create/import/update tools for this local plan.
  Use `--format schema` when you need exact nested fields. If network access is
  unavailable, use the bundled `references/*.md` and rely on `plan local check` to
  catch invalid tags. Copy the catalog examples verbatim for the fields the
  registry table cannot encode: `checklist` items need `id` and `label`;
  `question-form` questions need `id`, `title`, and `mode`, and each option needs
  `id` and `label`; and `Code` / `AnnotatedCode` / `Diff` are whitespace-sensitive
  — encode multiline code as JSON string attributes such as `code={"const x =\n  y"}`
  (a static template literal is accepted only when it has no `${...}`
  interpolation). `plan local check` is a quick OFFLINE lint (a subset of the
  renderer schema), so a green `check` does not guarantee the plan renders;
  `plan local verify` is the authoritative validation against the real renderer
  schema.
- **Write a local MDX folder.** Use `plans/<slug>/` to check the artifact into the
  repo, or a repo-ignored/temporary folder such as `.agent-native/plans/<slug>/`
  or `/tmp/agent-native-plans/<slug>/` when it should not be committed to the repository.
  In local-files mode, after check and serve commands, provide the user with the bridge link and local bridge startup instructions.
