---
name: detail-recap
description: Generate a Graphite-style layered PR review recap from Git diffs. Use when the user asks for a diff viewer, PR recap, change review dashboard, visual code review, why-did-this-change explanation, changed-files chart, review layers, stacked PR check, or wants to inspect what happened across a branch, commit range, staged diff, or working tree while keeping generated review data out of the project.
---

# Detail Recap

Create a local Graphite-style PR check that explains what changed, where it changed, why the change appears to exist, and where review attention should go first. Shape the first screen like a layered review stack: headline story, metrics, chart, review order, risk and rationale, then exact diffs. Treat the recap as an ephemeral review room: the project keeps the skill and runner, while generated diff data lives only in a temp directory.

## Steps

1. Choose the diff target.
   - Use the user's explicit range when provided, such as `main..HEAD`, `main...feature`, `HEAD~3..HEAD`, or a base commit.
   - If they only ask to review current work, use `HEAD` so the runner compares `HEAD` against the working tree.
   - Completion criterion: the command target identifies exactly the changes the user wants reviewed.

2. Run the bundled generator from the repository root.
   - In this project, shell commands go through `rtk`, so prefer:
     ```bash
     rtk npm run diff:generate -- HEAD
     ```
   - For explicit ranges:
     ```bash
     rtk npm run diff:generate -- main...HEAD
     ```
   - Direct runner form:
     ```bash
     rtk node .agents/skills/detail-recap/scripts/detail-recap.js main...HEAD
     ```
   - Completion criterion: the command prints a local review URL and a temp directory path.

3. Review the generated recap like a PR check.
   - Start with the headline story, metrics, and layer churn chart.
   - Read the numbered review layers before opening individual files.
   - Treat "Why this happened" as an inference from paths, churn, file categories, and commit metadata.
   - Use the risk list to decide which files need line-level inspection.
   - Completion criterion: the review has a change story, a likely driver, the riskiest files, and the next verification step.

4. Keep generated review data ephemeral.
   - The runner writes `diff-data.json` and `detail-recap.html` under the OS temp directory.
   - Leave the runner process alive while the user reviews the page.
   - Stop the runner with Enter or Ctrl+C when review is done; it removes the temp directory automatically.
   - Use `--keep` only when the user explicitly asks to preserve temp output for debugging.
   - Completion criterion: no generated review JSON or HTML remains under `public/`, `scripts/`, or other project source directories.

## Review Lens

Use these labels consistently when explaining the recap:

- **What happened**: concrete changed areas, file counts, additions/removals, status mix, and architectural layers touched.
- **Why it happened**: inferred drivers from paths, tests, config, UI, auth, routing, generated artifacts, and commit metadata. Say when this is an inference.
- **Review layers**: a numbered stack from workflow/boundary changes through domain, interface, application, verification, and support.
- **Review risk**: files with large churn, auth/routing/config impact, broad test rewrites, generated artifacts, or missing matching tests.
- **Verification**: commands or manual checks that would prove the change is healthy.
- **Review order**: boundary/config first, domain behavior next, routes/UI after intent is clear, tests last as proof.

## Output Shape

When reporting back to the user, keep it short and PR-review oriented:

1. Name the review URL if the server is still running.
2. Give the one-sentence change story.
3. List the top risk files or say no elevated risks were detected.
4. Name the most useful verification command or manual check.
5. Confirm generated recap data lives in temp storage and will be deleted when the server stops.

## Temp Hygiene

The recap should not add project artifacts. If old generated files exist from a previous workflow, remove them or ask before preserving them:

- `public/diff-data.json`
- `public/diff-viewer.html`
- `scripts/generate-diff.js`

The durable implementation belongs in this skill:

- `.agents/skills/detail-recap/SKILL.md`
- `.agents/skills/detail-recap/scripts/detail-recap.js`
