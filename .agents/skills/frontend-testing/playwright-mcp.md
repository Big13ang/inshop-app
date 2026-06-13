# Playwright MCP — Browser-First Test Generation

> **The rule**: Never write an E2E test from imagination or by reading source code alone.
> Always observe the running page first. Tests written from assumptions test your assumptions —
> not the software.

When Claude Code writes a new Playwright test, it uses the Playwright MCP tools
to observe the real, running page **before emitting a single line of test code**.

---

## Why Browser-First?

Reading source code does not tell you:
- The exact text of rendered elements (translations, formatting)
- Real `aria-*` attribute values at runtime
- Whether elements are hidden by CSS vs removed from the DOM
- Actual focus order in the browser
- What the page looks like during loading/transitioning states

Locators written from source code are fiction. Locators written from
`browser_snapshot` / `browser_screenshot` are facts.

---

## The Mandatory 9-Step Workflow

Never skip steps. Never jump to step 6.

```
1. NAVIGATE    → browser_navigate to the target URL
2. SNAPSHOT    → browser_snapshot — see the accessibility tree
3. SCREENSHOT  → browser_take_screenshot — confirm visual state
4. INTERACT    → browser_fill / browser_click / browser_press_key
5. SNAPSHOT    → browser_snapshot — see state after interaction
6. SCREENSHOT  → browser_take_screenshot — confirm visual change
7. VERIFY      → confirm what actually happened (not what you expected)
8. GENERATE    → only now, emit the Playwright TypeScript test
9. RUN         → execute the test, iterate until green
```

---

## Step-by-Step with MCP Tools

### Step 1 — Navigate

```
browser_navigate({ url: "http://localhost:3000/auth/login" })
```

### Step 2 — Snapshot (accessibility tree)

```
browser_snapshot()
```

This returns the ARIA tree — the same view screen readers and Playwright
role-based locators use. Read it carefully:
- What role does the submit button have? (`button`)
- What is its accessible name? (`"دریافت کد تایید"` or `"Submit"`?)
- Is the phone input a `textbox`? Does it have a label?

### Step 3 — Screenshot

```
browser_take_screenshot()
```

Confirm the visual state matches what the snapshot says.

### Step 4 — Interact

```
browser_fill({ selector: "[role=textbox]", value: "0917123" })
```

Or by accessible name (safer):
```
browser_fill({ selector: "input[type=tel]", value: "0917123" })
```

### Step 5 — Snapshot after interaction

```
browser_snapshot()
```

Check: Did `aria-invalid` appear? Did the error message appear in the tree?
What is the exact text of the error message?

### Step 6 — Screenshot after interaction

```
browser_take_screenshot()
```

Confirm the error message is visible, the button is still disabled.

### Step 7 — Verify with evaluate

```
browser_evaluate({ script: "document.querySelector('[role=textbox]').getAttribute('aria-invalid')" })
```

This gives you the ground truth for your assertion.

---

## Example — Full Observation Session

**Goal**: write a test for "invalid phone shows error message"

```
1. browser_navigate({ url: "http://localhost:3000/auth/login" })
   → Page loaded

2. browser_snapshot()
   → textbox: "شماره موبایل" (label association confirmed)
   → button: "دریافت کد تایید" (role=button, disabled=true)

3. browser_take_screenshot()
   → Confirms: input, button visible; no error

4. browser_fill({ selector: "[role=textbox]", value: "0917123" })
   → Input now contains "0917123"

5. browser_snapshot()
   → alert: "شماره تلفن همراه معتبر نیست"
   → textbox: aria-invalid="true"

6. browser_take_screenshot()
   → Error message visible below input, red border on input

7. browser_evaluate({ script: "document.querySelector('[role=alert]').textContent" })
   → "شماره تلفن همراه معتبر نیست"
   ← THIS is the text to use in your assertion
```

**Now** write the test — locators and assertions come from what was observed:

```typescript
// e2e/auth/login.spec.ts
test('shows error message for invalid phone', async ({ loginPage }) => {
  await loginPage.fillPhone('0917123');

  // Text observed via browser_evaluate step 7
  await expect(loginPage.errorMessage).toHaveText('شماره تلفن همراه معتبر نیست');
  await expect(loginPage.phoneInput).toHaveAttribute('aria-invalid', 'true');
});
```

---

## Common Observation Mistakes

| Mistake | Fix |
|---|---|
| Asserting on text from source code | Use `browser_evaluate` to read actual DOM text |
| Assuming `aria-invalid` is set | Check it explicitly with `browser_snapshot` |
| Skipping snapshot after interaction | Always snapshot before and after |
| Writing test before seeing error message text | Observe it first |
| Using CSS selectors from source code | Check real ARIA roles in snapshot |

---

## Locators — Discover from Snapshot, Put in POM

Locators discovered during observation go into the **Page Object Model**,
not directly in the test file.

```typescript
// After observing: error message has text "شماره تلفن همراه معتبر نیست"

// ✅ Add to LoginPage.ts
this.errorMessage = page.getByText(/شماره تلفن همراه معتبر نیست/i);

// ✅ Use via POM in test
await expect(loginPage.errorMessage).toBeVisible();

// ❌ Never hardcode in the test file
await expect(page.getByText(/شماره تلفن/)).toBeVisible();
```

---

## Running and Iterating

```bash
# Run the test you just generated
npx playwright test e2e/auth/login.spec.ts

# If it fails — open the trace to see exactly what happened
npx playwright show-report

# Debug interactively (pauses at each step)
npx playwright test e2e/auth/login.spec.ts --debug
```

A test that fails on first run is normal. The trace tells you:
- What the page looked like at the moment of failure
- What locator didn't match
- What assertion failed

Fix the locator in the POM. Re-run. Repeat until green.

---

## Checklist — Before Writing Test Code

```
[ ] Navigated to the real running page
[ ] Took a snapshot — know exact roles and names of all elements
[ ] Took a screenshot — confirmed visual state
[ ] Simulated all interactions in the test scenario
[ ] Took snapshot/screenshot after each interaction
[ ] Read exact error message text via browser_evaluate
[ ] Confirmed aria-* values via browser_evaluate
[ ] Know whether elements appear/disappear vs become hidden
[ ] Know the exact URL after navigation/submission
[ ] Added locators to POM (not the test file)
```
