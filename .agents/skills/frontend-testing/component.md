# Component Tests — React Testing Library

Component tests render a real component in a JSDOM environment, simulate user
events, and assert on what the user actually sees. No shallow rendering.
No mocking of internal modules. Mock at the network boundary only (see [msw.md](msw.md)).

---

## Setup

```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['@testing-library/jest-dom', './jest.setup.ts'],
};

// jest.setup.ts
import '@testing-library/jest-dom';
import { server } from './src/mocks/server'; // MSW

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

---

## The #1 Rule — Test Behaviour, Not Implementation

**A test that breaks when you change HOW the code works — but the user experience didn't change — is a bad test.**

The diagnostic question: *"If I refactor the internals without touching what the user sees, does this test still pass?"*
If yes → behaviour test. If no → implementation test. Delete or rewrite implementation tests.

### The console.log anti-pattern

This is the most common implementation test in React codebases:

```typescript
// ❌ IMPLEMENTATION TEST — spying on an internal side effect
it('calls the submit handler', async () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const { user } = setup();

  await user.type(getPhoneInput(), '09171234567');
  await user.click(getSubmitButton());

  expect(consoleSpy).toHaveBeenCalledWith({ phone: '09171234567' });
  consoleSpy.mockRestore();
});
```

Why this is wrong:
- It tests that `console.log` is called — a stub that will be deleted when real logic lands
- When the implementation changes to `router.push('/otp')` or an API call, this test breaks
- The USER doesn't care about `console.log` — they care about what happens next

```typescript
// ✅ BEHAVIOUR TEST — test what the user sees after submitting
it('navigates to OTP page after valid phone is submitted', async () => {
  const { user } = setup();
  await user.type(getPhoneInput(), '09171234567');
  await user.click(getSubmitButton());
  // Assert on what the user observes — the next screen appearing
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /کد تایید/ })).toBeInTheDocument();
  });
});

// ✅ Or — if the component accepts an onSubmit callback as its public API:
it('calls onSubmit with the phone number on valid submission', async () => {
  const onSubmit = jest.fn();
  const user = userEvent.setup();
  render(<Login onSubmit={onSubmit} />);   // ← onSubmit IS the public contract

  await user.type(screen.getByRole('textbox'), '09171234567');
  await user.click(screen.getByRole('button', { name: /دریافت کد تایید/ }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({ phone: '09171234567' });
  });
});
```

The second example is only valid when `onSubmit` is an **explicit prop** — part of the component's public API.
If `onSubmit` is an internal function, mocking it is still an implementation test.

### The "wiring" test anti-pattern

Any test suite named "wiring", "plumbing", or "integration of X with Y" is a warning sign.
These suites test how the component is assembled, not what the user gets.

```typescript
// ❌ IMPLEMENTATION TEST — verifying internal attribute wiring
describe('Login — SubmitButton submitting state wiring', () => {
  it('submit button renders with type="submit"', () => { ... });
  it('submit button contains the correct label text before submission', () => { ... });
});
```

The comment "documents the EXPECTED behaviour once onSubmit becomes async" is the tell:
if you're documenting future behaviour, write the test when that behaviour exists.
Placeholder tests for code that doesn't work yet are documentation, not tests.

```typescript
// ✅ Test the behaviour that actually exists right now
// If loading state doesn't work yet — don't write the test yet.
// Write it in the same commit that implements it (TDD: red → green).
```

### The "renders X" render-audit anti-pattern

Listing every element on the page is also testing implementation — it breaks whenever
the UI is redesigned, even if the user experience improves.

```typescript
// ❌ IMPLEMENTATION — enumerates the component's DOM output
describe('Login — initial render', () => {
  it('renders the inShop logo', () => { ... });
  it('renders the page heading with correct text', () => { ... });
  it('renders the subtitle text', () => { ... });
  it('renders the terms text', () => { ... });
  it('renders the phone input', () => { ... });
  it('renders the submit button with correct label', () => { ... });
});
```

Six tests that all break together if the marketing team renames the logo.

```typescript
// ✅ BEHAVIOUR — test the things that matter to the user's task
it('user can see the phone input on load', () => {
  setup();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});

it('submit button is disabled until a phone is entered', () => {
  setup();
  expect(screen.getByRole('button', { name: /دریافت کد تایید/ })).toBeDisabled();
});
```

Keep render smoke tests to the minimum needed to confirm the form is usable —
input present, button present and disabled, no error on load.
Branding, copy, and layout belong in E2E / visual tests, not component tests.

### Decision rule

| What you're asserting | Type | Keep? |
|---|---|---|
| User can submit and sees the next screen | Behaviour | ✅ Yes |
| Error message appears when phone is invalid | Behaviour | ✅ Yes |
| Button is disabled until input is valid | Behaviour | ✅ Yes |
| `console.log` was called with the data | Implementation | ❌ Delete |
| Internal function / service was called | Implementation | ❌ Delete |
| `type="submit"` attribute is present | Implementation | ❌ Delete |
| Component "renders" 7 listed elements | Implementation | ❌ Reduce to minimum |
| Behaviour that doesn't exist yet | Future implementation | ❌ Write when it exists |

---

## The 3-Tier Functional Driver Pattern (SOLID & Reusable)

**Never render in `beforeAll` or share a `user` instance.**
Every test uses a fresh driver factory that encapsulates DOM queries and user actions without classes or OOP boilerplate.

```
┌────────────────────────────────────────────────────────┐
│  Tier 1: Domain Locators (authLocators)                │  DOM queries only
├────────────────────────────────────────────────────────┤
│  Tier 2: Domain Actions (createAuthActions)            │  User interactions
├────────────────────────────────────────────────────────┤
│  Tier 3: Flow Driver (createLoginDriver)               │  Mounts & composes
└────────────────────────────────────────────────────────┘
```

### Shared Driver Definition (`features/auth/testing/authDrivers.tsx`)

```typescript
import { render, screen, userEvent } from '@/lib/test-utils';
import Login, { LoginProps } from '@/features/auth/login/Login';
import { TEXTS as LOGIN_TEXTS } from '@/features/auth/login/constants';

type User = ReturnType<typeof userEvent.setup>;

// ─── Tier 1: Domain Locators (SRP: Querying DOM Elements) ───────────────────
export const authLocators = {
  phoneInput: (name: RegExp | string = new RegExp(LOGIN_TEXTS.label, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.getByRole('textbox', { name: regex });
  },
  phoneInputByPlaceholder: (placeholder: RegExp | string = new RegExp(LOGIN_TEXTS.placeholder, 'i')) => {
    const regex = typeof placeholder === 'string' ? new RegExp(placeholder, 'i') : placeholder;
    return screen.getByPlaceholderText(regex);
  },
  phoneLabel: () => screen.getByLabelText(LOGIN_TEXTS.label),
  alert: () => screen.getByRole('alert'),
  queryAlert: () => screen.queryByRole('alert'),
  submitButton: (name: RegExp | string = new RegExp(LOGIN_TEXTS.submit, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.getByRole('button', { name: regex });
  },
  querySubmitButton: (name: RegExp | string = new RegExp(LOGIN_TEXTS.submit, 'i')) => {
    const regex = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return screen.queryByRole('button', { name: regex });
  },
};

// ─── Tier 2: Domain Actions (SRP: User Interactions) ────────────────────────
export const createAuthActions = (user: User) => ({
  fillPhone: (phone: string) => user.type(authLocators.phoneInput(), phone),
  clearPhone: () => user.clear(authLocators.phoneInput()),
  submitPhone: () => user.type(authLocators.phoneInput(), '{Enter}'),
  clickSubmit: (name?: RegExp | string) => user.click(authLocators.submitButton(name)),
});

// ─── Tier 3: Feature Driver (SRP: Mounts & Composes for Login) ──────────────
export interface LoginDriverOptions {
  onSubmit?: LoginProps['onSubmit'];
}

export function createLoginDriver(options: LoginDriverOptions = {}) {
  const onSubmit = options.onSubmit ?? jest.fn();
  const user = userEvent.setup();
  const actions = createAuthActions(user);

  render(<Login onSubmit={onSubmit} />);

  return {
    user,
    onSubmit,
    ...actions,

    // Element queries delegated directly to authLocators
    phoneLabel: authLocators.phoneLabel,
    phoneInput: authLocators.phoneInput,
    alert: authLocators.alert,
    queryAlert: authLocators.queryAlert,

    // Button queries
    submitButton: () => authLocators.submitButton(LOGIN_TEXTS.submit),
    submittingButton: () => authLocators.submitButton(LOGIN_TEXTS.isSubmitting),
    querySubmitButton: () => authLocators.querySubmitButton(LOGIN_TEXTS.submit),
    querySubmittingButton: () => authLocators.querySubmitButton(LOGIN_TEXTS.isSubmitting),

    // Composite flow action
    fillAndSubmit: async (phone: string) => {
      await actions.fillPhone(phone);
      await actions.clickSubmit(LOGIN_TEXTS.submit);
    },
  };
}
```

---

## Query Priority — Highest to Lowest

| Rank | Query | Why |
|---|---|---|
| 1 | `getByRole` | What screen readers expose |
| 2 | `getByLabelText` | Validates `<label>` association |
| 3 | `getByText` | Visible text content |
| 4 | `getByPlaceholderText` | When nothing better is available |
| 5 | `getByTestId` | Last resort — couples test to DOM |

**Never use**: `querySelector`, class selectors, XPath.

---

## Complete Form Component Test (`features/auth/login/__tests__/Login.test.tsx`)

```typescript
import { waitFor, expect } from '@/lib/test-utils';
import { TEXTS } from '../constants';
import { VALID_PHONES, INVALID_PHONES } from './fixtures/phones';
import { createLoginDriver } from '@/features/auth/testing/authDrivers';

// ─── Initial State ────────────────────────────────────────────────────────────
describe('Login Component - Initial State', () => {
  it('renders phone input with associated label and disabled submit button', () => {
    const page = createLoginDriver();

    expect(page.phoneLabel()).toBeInTheDocument();
    expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'false');
    expect(page.submitButton()).toBeDisabled();
  });

  it('does not display validation error before user interaction', () => {
    const page = createLoginDriver();

    expect(page.queryAlert()).not.toBeInTheDocument();
  });
});

// ─── Validation & Error Recovery ──────────────────────────────────────────────
describe('Login Component - Validation & Error Recovery', () => {
  it('shows error feedback and sets aria-invalid when invalid phone is entered', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.tooShort);

    await waitFor(() => {
      expect(page.alert()).toBeInTheDocument();
      expect(page.alert()).toHaveTextContent(TEXTS.errorInvalidPhone);
      expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('clears error feedback and resets aria-invalid when user corrects to a valid phone', async () => {
    const page = createLoginDriver();

    await page.fillPhone(INVALID_PHONES.tooShort);
    await waitFor(() => expect(page.queryAlert()).toBeInTheDocument());

    await page.clearPhone();
    await page.fillPhone(VALID_PHONES.standard);

    await waitFor(() => {
      expect(page.queryAlert()).not.toBeInTheDocument();
      expect(page.phoneInput()).toHaveAttribute('aria-invalid', 'false');
    });
  });
});

// ─── Submit Button State ──────────────────────────────────────────────────────
describe('Login Component - Submit Button State', () => {
  it('enables submit button on valid phone and re-disables when cleared', async () => {
    const page = createLoginDriver();

    await page.fillPhone(VALID_PHONES.standard);
    await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

    await page.clearPhone();
    await waitFor(() => expect(page.submitButton()).toBeDisabled());
  });
});

// ─── Submission Flow ──────────────────────────────────────────────────────────
describe('Login Component - Submission Flow', () => {
  it('calls onSubmit with valid phone number on button click', async () => {
    const page = createLoginDriver();

    await page.fillAndSubmit(VALID_PHONES.standard);

    await waitFor(() => {
      expect(page.onSubmit).toHaveBeenCalledTimes(1);
      expect(page.onSubmit).toHaveBeenCalledWith({ phone: VALID_PHONES.standard });
    });
  });

  it('submits the form when Enter key is pressed in phone input with valid data', async () => {
    const page = createLoginDriver();

    await page.fillPhone(VALID_PHONES.standard);
    await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

    await page.submitPhone();

    await waitFor(() => {
      expect(page.onSubmit).toHaveBeenCalledTimes(1);
      expect(page.onSubmit).toHaveBeenCalledWith({ phone: VALID_PHONES.standard });
    });
  });

  it('displays loading state and disables submit button during async submission', async () => {
    let resolveSubmit!: () => void;
    const asyncSubmit = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    const page = createLoginDriver({ onSubmit: asyncSubmit });

    await page.fillPhone(VALID_PHONES.standard);
    await waitFor(() => expect(page.submitButton()).not.toBeDisabled());

    await page.clickSubmit();

    // In-flight state: button shows loading text & is disabled
    await waitFor(() => {
      expect(page.querySubmittingButton()).toBeInTheDocument();
      expect(page.querySubmittingButton()).toBeDisabled();
      expect(page.querySubmitButton()).not.toBeInTheDocument();
    });

    resolveSubmit();

    // Completion state: normal button restored
    await waitFor(() => {
      expect(page.querySubmitButton()).toBeInTheDocument();
      expect(page.querySubmittingButton()).not.toBeInTheDocument();
    });
  });
});

---

## Async — Always Use `waitFor`

State changes driven by user events, effects, or API calls are async.

```typescript
// ❌ Synchronous assertion on async state — often passes by accident
expect(screen.getByRole('alert')).toBeInTheDocument();

// ✅ Wait for the DOM to update
await waitFor(() => {
  expect(screen.getByRole('alert')).toBeInTheDocument();
});

// ✅ Or use findBy* (built-in waitFor wrapper)
const alert = await screen.findByRole('alert');
expect(alert).toHaveTextContent(/شماره تلفن/);
```

`findBy*` vs `waitFor`:
- Use `findBy*` when you need to await the element's appearance
- Use `waitFor` when asserting on multiple things or non-element conditions

---

## Spies on External Boundaries

Only spy on things you don't control: `console`, `window.location`, `router.push`.

```typescript
describe('Login — error logging', () => {
  it('logs API errors to console.error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // ... trigger error
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('API error'));
    spy.mockRestore(); // ← always restore
  });
});
```

**Always call `mockRestore()`** after a spy — never in `afterEach`.
Restoring in the same test that creates the spy makes it self-contained.

---

## RTL Coverage Checklist

For any form component:
```
[ ] All key elements render (input, button, label, heading)
[ ] Label is associated with input (getByLabelText passes)
[ ] Correct input type attribute (type="tel", "email", etc.)
[ ] Button disabled on empty / invalid state
[ ] Button enabled on valid input
[ ] Error message TEXT appears (not just aria-invalid)
[ ] aria-invalid="true" on invalid input
[ ] Error clears when user corrects input
[ ] Submission fires with correct payload on valid input
[ ] Submission does NOT fire on invalid input
[ ] Loading / submitting state shown during async action
[ ] Error state shown on API failure
```
