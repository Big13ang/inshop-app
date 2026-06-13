# RTK — Rust Token Killer (Antigravity Enforcement Rules)

## ⚠️ CRITICAL — MANDATORY RULE — NO EXCEPTIONS

You are **FORBIDDEN** from running any shell command without the `rtk` prefix.

This applies to **every single `run_command` tool call**, without exception.

---

## Rule

**ALWAYS** prefix shell commands with `rtk`. This is non-negotiable.

| ❌ WRONG — Never do this | ✅ CORRECT — Always do this |
|--------------------------|------------------------------|
| `git status`             | `rtk git status`             |
| `git log -n 5`           | `rtk git log -n 5`           |
| `git diff`               | `rtk git diff`               |
| `npm run dev`            | `rtk npm run dev`            |
| `npm run test`           | `rtk npm run test`           |
| `npm run build`          | `rtk npm run build`          |
| `ls src/`                | `rtk ls src/`                |
| `cat file.ts`            | `rtk cat file.ts`            |
| `grep "pattern" src/`    | `rtk grep "pattern" src/`    |
| `find . -name "*.ts"`    | `rtk find . -name "*.ts"`    |
| `npx jest`               | `rtk npx jest`               |
| `tsc --noEmit`           | `rtk tsc --noEmit`           |

---

## Why This Matters

RTK (Rust Token Killer) is a CLI proxy that **filters and compresses command output** before it reaches the LLM context window. It saves **60–90% of tokens** on every command. Skipping it wastes the user's money and slows down the session.

---

## Meta Commands (run these directly without rtk prefix)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Command history with savings
rtk discover          # Find missed RTK opportunities
rtk proxy <cmd>       # Run raw (no filtering, for debugging)
rtk --version         # Check installed version
```

---

## Self-Check Before Every run_command Call

Before executing ANY command, ask yourself:

> "Does this command start with `rtk`?"

- **YES** → proceed
- **NO** → prepend `rtk` first, THEN proceed

There are **zero valid reasons** to skip `rtk` on standard shell commands.
