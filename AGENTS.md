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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

