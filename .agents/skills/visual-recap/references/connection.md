# Connecting & publishing — single source of truth

This file is the canonical rule for the never-inline deliverable, finding the
Plan MCP connector, and restoring it when its tools are missing. It is shared
word for word by `/visual-plan` and `/visual-recap`. Read it when you are about
to publish, or whenever a connector or auth error appears; do not improvise an
inline fallback from memory.

<!-- SHARED-CORE:connection START -->

**The deliverable is ALWAYS a published Agent-Native Plan, never inline chat
content.** Do not hand the plan or recap to the user as Markdown prose, an ASCII
sketch, a table, a fenced "wireframe", or a "here's the summary" paragraph. The
entire value is the hosted, interactive, annotatable Plan; an inline summary is
the thing a Plan replaces, not a degraded version of one. The only supported
output is to publish through the Plan MCP connector and return its absolute URL.
Local-files privacy mode (`references/local-files.md`) is the one exception.

**The connector is usually the `plan` server**, but older installed agents may
expose the same hosted connector as `agent-native-plans` — both names are valid,
so never report the connector as missing just because it is named
`agent-native-plans` instead of `plan`. Some clients also lazy-load connector
tools through a deferred tool registry instead of showing the namespace upfront.
Before declaring the connector missing, search/load tools with the host's
discovery surface (`tool_search` or registry) — often the tools are registered
underneath a namespace that is loaded on first access. If they are still
missing, check if the client or server was recently restarted or had its credentials cleared.

When an error occurs during publish or update, do not dump the raw response or database stack trace to the user. Explain the connection issue in friendly text, look up the connector status, and provide the correct recovery steps.
