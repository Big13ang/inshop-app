# Playwright MCP Server

The Playwright MCP server lets AI agents (Antigravity, Claude Code, Codex CLI) control a real Chromium browser — navigate, click, fill inputs, take screenshots, and run JavaScript — without any additional setup from you.

## How it works

The project has `.mcp.json` at the root. Any MCP-compatible AI tool that reads this file will automatically have access to the Playwright browser tools.

```json
// .mcp.json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp", "--browser", "chromium"]
    }
  }
}
```

## Available tools (what the AI can do)

| Tool | What it does |
|---|---|
| `browser_navigate` | Go to a URL |
| `browser_screenshot` | Capture the current page as an image |
| `browser_click` | Click an element by selector or text |
| `browser_fill` | Fill an input field |
| `browser_press` | Press a keyboard key |
| `browser_evaluate` | Run JavaScript in the page context |
| `browser_wait_for` | Wait for text or selector to appear |
| `browser_select_option` | Select a dropdown option |
| `browser_check` / `browser_uncheck` | Toggle checkboxes |

## Setup for Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp", "--browser", "chromium"]
    }
  }
}
```

## Usage by AI agents

When Antigravity or any other agent wants to verify a UI change, it can:

```
1. Start the dev server: npm run dev
2. Use browser_navigate to go to http://localhost:3000/auth/login
3. Use browser_screenshot to visually confirm the page
4. Use browser_fill to enter a phone number
5. Use browser_screenshot again to verify validation state
```

## Running E2E tests manually

```bash
# Run all E2E tests (auto-starts the dev server)
npm run test:e2e

# Interactive UI mode — watch tests run step by step
npm run test:e2e:ui

# Debug a specific test
npm run test:e2e:debug

# Open the HTML report after a run
npm run test:e2e:report
```

## Test structure

```
e2e/
├── pages/
│   └── LoginPage.ts          ← Page Object Model (locators + actions)
├── fixtures/
│   └── index.ts              ← Custom fixtures (pre-navigated pages)
└── auth/
    └── login.spec.ts         ← Login page E2E tests
```

Test data is shared with unit tests via:
`features/auth/login/__tests__/fixtures/phones.ts`
