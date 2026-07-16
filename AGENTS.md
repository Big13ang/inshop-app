<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## React Compiler is ON — no manual memoization

This project runs **React Compiler** (`babel-plugin-react-compiler`, enabled via `reactCompiler: true` in `next.config.ts`).

**The compiler automatically handles all memoization. You MUST NOT add manual memos.**

### Forbidden patterns (the compiler does this for you)
- ❌ `useCallback(fn, deps)` — just write `const fn = () => {}`
- ❌ `useMemo(() => value, deps)` — just write `const value = compute()`
- ❌ `React.memo(Component)` — just write `function Component() {}`

### Allowed escape hatches
- ✅ `"use memo"` directive — opt a specific component **in** (annotation mode)
- ✅ `"use no memo"` directive — opt a specific component **out** when the compiler breaks it

### Rule of thumb
Write plain React. If you feel the urge to wrap something in `useCallback` or `useMemo`, stop — the compiler already did it.

---

## React 19 Rules — ref is a normal prop

This project runs **React 19**. You MUST NOT use legacy patterns that are superseded or deprecated in React 19.

### Forbidden patterns (use React 19 features instead)
- ❌ `forwardRef<RefType, PropsType>((props, ref) => ...)` — `forwardRef` is deprecated.
- ❌ `PhoneInput.displayName = '...'` — unnecessary when using standard component functions.

### Preferred pattern
Pass and destructure `ref` directly as a normal prop:
```tsx
interface ComponentProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    ref?: React.Ref<HTMLInputElement>;
}

export default function Component({ label, ref, ...props }: ComponentProps) {
    return <input ref={ref} {...props} />;
}
```

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Developer Directives

- **RTK Usage**: Always prepend `rtk` to any shell command you run on this machine (e.g., `rtk git status`, `rtk npm test`).
- **Use Project HTTP Client**: Always use the project's custom `http` client (from `@/lib/utils`) instead of the native `fetch` API for making network requests. This ensures standard URL normalization, cookies/credentials management, and use of the `Result` wrapper pattern.
- **Extract Functions**: Avoid defining inline functions that span more than one line (e.g., multiline callback handlers or event listeners). Always extract them into named helper functions/handlers within the component or module to improve readability and testability.
- **No Response Transformation**: Do not transform backend API response field names or status values to custom frontend structures. Keep backend field names (e.g., `description`, `createdAt`, `rejectReason`) and status values (e.g., `'PENDING_REVIEW'`, `'REJECTED'`) as-is in frontend query services and models. Only use lightweight rendering utilities (e.g., `getMediaUrl`) to convert backend URLs/data at render time.
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

---

## Git Hooks (Lefthook)

This project uses **Lefthook** to run local-only linting and testing checks before every git push. This ensures code quality before pushing changes to the repository server.

### Available Hooks
- **Pre-Push**: Runs `npm run lint` and `npm run test` automatically.

### Installation & Usage
Git hooks are automatically configured on `npm install` (via the `prepare` script). To manually install/sync hooks:
```bash
rtk npx lefthook install
```

To run the pre-push check manually:
```bash
rtk npx lefthook run pre-push
```
