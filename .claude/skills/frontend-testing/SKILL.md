---
name: frontend-testing
description: >
  Complete frontend testing reference for React/Next.js apps. Covers unit tests
  (Jest), component tests (React Testing Library), network mocking (MSW v2),
  and E2E tests (Playwright + MCP browser workflow). Use for: writing any test,
  fixing failing tests, reviewing test coverage, TDD cycles, MSW setup,
  Playwright E2E, generating tests from the browser. Triggers on: "write test",
  "unit test", "component test", "RTL", "MSW", "mock service worker",
  "E2E", "Playwright", "test coverage", "TDD", "frontend testing".
---

# Frontend Testing — Master Reference

> From the perspective of a Senior Frontend Engineer at a product company.
> These standards exist because tests that don't catch real bugs are worse than no tests —
> they give false confidence while burning engineering time.

---

## The Testing Pyramid

```
             ┌──────────────────────┐
             │   E2E (few)          │  Real browser, full stack
             │   Playwright + MCP   │  Observe → Generate → Run
             ├──────────────────────┤
             │   Component (some)   │  RTL + userEvent + MSW
             │   Integration tests  │  Real children, real DOM
             ├──────────────────────┤
             │   Unit (many)        │  Pure logic, schemas, utils
             │   Jest               │  Fast, no DOM, no network
             └──────────────────────┘
```

Each layer has **one job**. Never use a slower layer to test what belongs in a faster one.

| Layer | Tests what | Tools |
|---|---|---|
| Unit | Pure logic, schemas, utils | Jest + `it.each` |
| Component | Render + interactions | RTL + `userEvent` + MSW |
| E2E | Full stack, real UX | Playwright + MCP |

---

## Sub-Files — Where to Go

| File | When to use |
|---|---|
| [unit.md](unit.md) | Testing schemas, validators, pure functions |
| [component.md](component.md) | Testing React components with RTL |
| [msw.md](msw.md) | Setting up and using Mock Service Worker |
| [e2e.md](e2e.md) | Writing Playwright E2E tests, POM, fixtures |
| [playwright-mcp.md](playwright-mcp.md) | Browser-first test generation via MCP |
| [fixtures.md](fixtures.md) | Shared test data, single source of truth |

---

## The Golden Rules

### 1. Test behaviour, not implementation

The diagnostic: *"If I refactor the internals without changing what the user sees, does this test still pass?"*
If no → it's an implementation test → delete or rewrite it.

```typescript
// ❌ Tests HOW — breaks on any internal rename or refactor
test('checkout calls paymentService.process', async () => {
  const spy = jest.spyOn(paymentService, 'process');
  await checkout(cart);
  expect(spy).toHaveBeenCalled();
});

// ❌ Tests HOW — spying on a stub that will be replaced
test('form logs submission data', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await user.click(submitBtn);
  expect(spy).toHaveBeenCalledWith({ phone: '09171234567' });
  spy.mockRestore();
});

// ✅ Tests WHAT — survives any internal refactor
test('checkout returns confirmed order for a valid cart', async () => {
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe('confirmed');
});

// ✅ Tests WHAT — what the user sees after submitting
test('navigates to OTP page after valid phone is submitted', async () => {
  await user.type(phoneInput, '09171234567');
  await user.click(submitBtn);
  await waitFor(() => expect(screen.getByRole('heading', { name: /کد تایید/ })).toBeInTheDocument());
});
```

See [component.md](component.md) for the full list of implementation anti-patterns with real examples.

### 2. One logical assertion per test

```typescript
// ❌ Which of these broke? You can't tell from the test name.
test('form works', async () => {
  expect(input).toBeInTheDocument();
  expect(button).toBeDisabled();
  await user.type(input, '09171234567');
  expect(button).toBeEnabled();
  await user.click(button);
  expect(spy).toHaveBeenCalled();
});

// ✅ Each failure is self-describing
test('submit button is disabled on fresh load', () => {
  render(<LoginForm />);
  expect(screen.getByRole('button', { name: /ارسال/ })).toBeDisabled();
});
test('submit button enables when a valid phone is entered', async () => {
  const { user } = setup();
  await user.type(screen.getByRole('textbox'), '09171234567');
  await waitFor(() => expect(screen.getByRole('button', { name: /ارسال/ })).not.toBeDisabled());
});
```

### 3. Tests are independent — no shared mutable state

```typescript
// ❌ State leaks between tests
let user: UserEvent;
beforeAll(() => { user = userEvent.setup(); render(<Login />); });

// ✅ Fresh world every test
const setup = () => {
  const user = userEvent.setup();
  render(<Login />);
  return { user };
};
```

### 4. Descriptive names — subject / scenario / expected

```typescript
// ❌ Tells you nothing about what broke
test('phone input test 1', ...);

// ✅ Reads like a specification
test('phone input sets aria-invalid="true" after invalid entry', ...);
test('shows Persian error text when phone number is too short', ...);
test('submit button is disabled when form is empty', ...);
```

### 5. Never wait with `setTimeout` / `waitForTimeout`

```typescript
// ❌ Flaky — depends on machine speed
await page.waitForTimeout(1000);
await new Promise(r => setTimeout(r, 500));

// ✅ Wait for the actual condition
await waitFor(() => expect(errorMsg).toBeInTheDocument());  // RTL
await expect(page.getByRole('alert')).toBeVisible();        // Playwright
```

---

## Mock at system boundaries only

| Boundary | Tool |
|---|---|
| HTTP / network | MSW (`http.post`, `http.get`) |
| Time / timers | `jest.useFakeTimers()` |
| External SDKs | `jest.mock('stripe')` |
| Console | `jest.spyOn(console, 'error')` |

**Never mock**: your own components, your own modules, internal hooks you wrote.

---

## Anti-Patterns — Quick Reference

| Pattern | Problem | Fix |
|---|---|---|
| `waitForTimeout(n)` | Flaky, timing-dependent | `waitFor()` / `expect().toBeVisible()` |
| CSS selector queries | Couples to styling | `getByRole` / `getByLabelText` |
| `beforeAll` shared render | State leaks between tests | `setup()` in each test |
| `jest.mock('../myModule')` | Tests implementation | Mock at HTTP boundary (MSW) |
| Missing `mockRestore()` | Spy leaks to next test | Restore in each test |
| `test.only` committed | Skips all other tests | `forbidOnly: true` in CI |
| E2E for unit logic | Wrong layer, slow | Write a unit test |
| Hardcoded test data | Diverges across layers | `fixtures/` shared file |
