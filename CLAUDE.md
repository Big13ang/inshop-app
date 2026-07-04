@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Developer Directives & UI Components

- **RTK Usage**: Always prepend `rtk` to any shell command you run on this machine (e.g., `rtk git status`, `rtk npm test`).
- **Clean Architecture**: Use the `Result` pattern (`Result.ok`, `Result.err`) anywhere you can for cleaner, exception-free code.
- **Use Custom UI Components**: Always prioritize using custom UI components defined in the project over raw HTML elements or external components.
  - **Buttons**: Use `<Button>` from `@/components/ui/button` instead of native `<button>`.
  - **Inputs**: Use `<Input>` from `@/components/ui/input` instead of native `<input>`.
  - **Textareas**: Use `<Textarea>` from `@/components/ui/textarea` instead of native `<textarea>`.
  - **Dialogs**: Use `Dialog` from `@/components/ui/Dialog` instead of native `<dialog>` or custom dialog containers.
  - **Bottom Sheets**: Use `BottomSheet` from `@/components/ui/BottomSheet` for slide-up drawers/sheets.
  - **Back Button**: Use `BackButton` from `@/components/ui/BackButton` for header/page back buttons.
  - **Verified Badges**: Use `VerifiedBadge` from `@/components/ui/VerifiedBadge` for verification markers.
  - **Toast Notifications**: Use `toast` from `sonner` or `@/components/ui/sonner`.
- **Git Hooks (Lefthook)**: Pre-push git hook runs linting and unit tests locally before pushing to the server. Refer to [AGENTS.md](file:///h:/InShop/inshop-app/AGENTS.md#git-hooks-lefthook) for configuration details.
